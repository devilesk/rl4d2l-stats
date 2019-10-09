const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const { findInArray } = require('../common/util');
const connection = require('./connection');
const execQuery = require('../common/execQuery.js');
const config = require('./config');
const logger = require('../cli/logger');

const Constants = {
    SUCCESS: 1,
    BET_NOT_FOUND: 2,
    INVALID_CHOICE: 3,
    WAGER_ADDED: 4,
    WAGER_UPDATED: 5,
    WAGER_REMOVED: 6,
    WAGER_NOT_FOUND: 7,
    INSUFFICIENT_FUNDS: 8,
    BET_OPEN: 9,
    BET_CLOSED: 10,
    BET_IS_CLOSED: 12,
    AMBIGUOUS_CHOICE: 13,
    BET_ENDED: 14,
    TRANSACTION_RECEIVE: 15,
    TRANSACTION_WITHDRAW: 16,
    INVALID_RECIPIENT: 17,
}

const historyQuery = `SELECT a.source as source, a.target as target, a.amount as amount, a.type as type, a.comment as comment, b.choice as choice, b.amount as wagerAmount, c.name as name, c.winner as winner
FROM transaction a
LEFT JOIN wager b ON a.wagerId = b.id
LEFT JOIN bet c ON b.betId = c.id
WHERE a.deleted = 0 AND a.source = ?
ORDER BY a.createdAt`;

const wagerSorter = (wagerA, wagerB) => {
    if (wagerA.amount > wagerB.amount) return -1;
    if (wagerA.amount < wagerB.amount) return 1;
    return 0;
}

class BetManager {
    constructor() {
        this.lockTimers = {};
        this.init();
    }
    
    async init() {
        const bets = await this.getBets();
        for (const bet of bets) {
            this.setBetLockTimer(bet);
        }
    }
    
    async logTransaction(source, target, amount, type, wagerId, comment) {
        await execQuery(connection, "INSERT INTO transaction (source, target, amount, type, wagerId, comment, deleted) VALUES (?, ?, ?, ?, ?, ?, 0)", [source, target, amount, type, wagerId, comment]);
    }
    
    async getHistory(userId) {
        return (await execQuery(connection, historyQuery, [userId])).results;
    }
    
    async getBankrolls() {
        return (await execQuery(connection, 'SELECT * FROM bankroll WHERE deleted = 0')).results;
    }
    
    async getActiveBankrolls() {
        return (await execQuery(connection, `SELECT a.userId as userId, MAX(a.amount) as amount
        FROM bankroll a
        JOIN wager b ON a.userId = b.userId
        WHERE a.deleted = 0
        GROUP BY a.userId;`)).results;
    }
    
    async getBankroll(userId) {
        const results = (await execQuery(connection, 'SELECT amount FROM bankroll WHERE deleted = 0 AND userId = ?', [userId])).results;
        if (!results.length) {
            await execQuery(connection, 'INSERT INTO bankroll (userId, amount, deleted) VALUES (?, ?, 0)', [userId, config.settings.bankrollStartingAmount]);
            await this.logTransaction(userId, null, config.settings.bankrollStartingAmount, Constants.TRANSACTION_RECEIVE, null, 'initial bankroll');
            return config.settings.bankrollStartingAmount;
        }
        return results[0].amount;
    }
    
    async setBankroll(userId, amount) {
        await this.getBankroll(userId);
        const results = (await execQuery(connection, 'UPDATE bankroll SET amount = ? WHERE deleted = 0 AND userId = ?', [amount, userId])).results;
        return results.affectedRows > 0;
    }
    
    async getBet(name) {
        const results = (await execQuery(connection, 'SELECT * FROM bet WHERE deleted = 0 AND name = ? AND status <> ?', [name, Constants.BET_ENDED])).results;
        if (!results.length) return null;
        return results[0];
    }
    
    setBetLockTimer(name, lockTimestamp) {
        if (lockTimestamp) {
            if (this.lockTimers[name]) {
                clearTimeout(this.lockTimers[name]);
            }
            logger.debug(`setBetLockTimer ${name} now: ${new Date()} lock: ${new Date(lockTimestamp * 1000)}. timer: ${lockTimestamp * 1000 - new Date()}`);
            this.lockTimers[name] = setTimeout(async () => {
                delete this.lockTimers[name];
                await this.closeBet(name);
            }, Math.max(0, lockTimestamp * 1000 - new Date()));
        }
    }
    
    async setBetLockTimestamp(name, lockTimestamp) {
        const results = (await execQuery(connection, 'UPDATE bet SET lockTimestamp = ? WHERE deleted = 0 AND name = ?', [lockTimestamp, name])).results;
        if (results.affectedRows > 0) {
            this.setBetLockTimer(name, lockTimestamp);
        }
    }
    
    async addBet(name, choices, lockTimestamp) {
        const bet = await this.getBet(name);
        if (bet) return false;
        await execQuery(connection, 'INSERT INTO bet (name, choices, status, createdTimestamp, lockTimestamp, deleted) VALUES (?, ?, ?, ?, ?, 0)', [name, choices, Constants.BET_OPEN, Math.floor(new Date().getTime() / 1000), lockTimestamp]);
        this.setBetLockTimer(name, lockTimestamp);
        return true;
    }
    
    async getBetWagers(betId) {
        return (await execQuery(connection, 'SELECT * FROM wager WHERE deleted = 0 AND betId = ?', [betId])).results;
    }
    
    async getBetWager(betId, userId) {
        return (await execQuery(connection, 'SELECT * FROM wager WHERE deleted = 0 AND betId = ? AND userId = ?', [betId, userId])).results[0];
    }
    
    async removeBet(name) {
        const bet = await this.getBet(name);
        if (!bet) return Constants.BET_NOT_FOUND;
        (await execQuery(connection, 'UPDATE bet SET deleted = 1 WHERE deleted = 0 AND name = ? AND status <> ?', [name, Constants.BET_ENDED])).results;
        const wagers = await this.getBetWagers(bet.id);
        for (const wager of wagers) {
            await execQuery(connection, 'UPDATE wager SET deleted = 1 WHERE id = ?', [wager.id]);
            let bankroll = await this.getBankroll(wager.userId);
            bankroll = bankroll + wager.amount;
            await this.setBankroll(wager.userId, bankroll);
            await this.logTransaction(wager.userId, null, wager.amount, Constants.TRANSACTION_RECEIVE, wager.id, 'bet removed');
        }
        if (this.lockTimers[name]) {
            clearTimeout(this.lockTimers[name]);
            delete this.lockTimers[name];
        }
        return Constants.SUCCESS;
    }
    
    async openBet(name) {
        const results = (await execQuery(connection, 'UPDATE bet SET status = ?, closeTimestamp = NULL WHERE deleted = 0 AND name = ?', [Constants.BET_OPEN, name])).results;
        return results.affectedRows > 0 ? Constants.SUCCESS : Constants.BET_NOT_FOUND;
    }
    
    async closeBet(name) {
        const results = (await execQuery(connection, 'UPDATE bet SET status = ?, closeTimestamp = ? WHERE deleted = 0 AND name = ?', [Constants.BET_CLOSED, Math.floor(new Date().getTime() / 1000), name])).results;
        return results.affectedRows > 0 ? Constants.SUCCESS : Constants.BET_NOT_FOUND;
    }
    
    async endBet(name, winner) {
        const bet = await this.getBet(name);
        if (!bet) return Constants.BET_NOT_FOUND;
        if (bet.choices.split(',').indexOf(winner) === -1) return Constants.INVALID_CHOICE;
        let winners = [];
        let losers = [];
        const wagers = await this.getBetWagers(bet.id);
        for (const wager of wagers) {
            let bankroll = await this.getBankroll(wager.userId);
            if (wager.choice === winner) {
                bankroll += 2 * wager.amount;
                winners.push(wager);
            }
            else {
                losers.push(wager);
            }
            await this.setBankroll(wager.userId, bankroll);
            if (wager.choice === winner) {
                await this.logTransaction(wager.userId, null, 2 * wager.amount, Constants.TRANSACTION_RECEIVE, wager.id, 'bet won');
            }
            else {
                await this.logTransaction(wager.userId, null, 0, Constants.TRANSACTION_WITHDRAW, wager.id, 'bet lost');
            }
        }
        const results = (await execQuery(connection, 'UPDATE bet SET winner = ?, status = ?, endTimestamp = ? WHERE deleted = 0 AND name = ?', [winner, Constants.BET_ENDED, Math.floor(new Date().getTime() / 1000), name])).results;
        if (this.lockTimers[name]) {
            clearTimeout(this.lockTimers[name]);
            delete this.lockTimers[name];
        }

        winners = winners.sort(wagerSorter);
        losers = losers.sort(wagerSorter);
        
        return { winners, losers };
    }
    
    async addWager(name, userId, choice, amount) {
        let bankroll = await this.getBankroll(userId);
        const bet = await this.getBet(name);
        logger.debug(name);
        logger.debug(JSON.stringify(bet));
        if (!bet) return Constants.BET_NOT_FOUND;
        if (bet.status !== Constants.BET_OPEN) return Constants.BET_IS_CLOSED;
        if (bet.choices.split(',').indexOf(choice) === -1) return Constants.INVALID_CHOICE;
        const wager = await this.getBetWager(bet.id, userId);
        let result;
        if (wager) {
            if (amount > bankroll + wager.amount) return Constants.INSUFFICIENT_FUNDS;
            await execQuery(connection, 'UPDATE wager SET amount = ?, choice = ? WHERE id = ?', [amount, choice, wager.id]);
            bankroll = bankroll + wager.amount - amount;
            await this.setBankroll(userId, bankroll);
            await this.logTransaction(wager.userId, null, wager.amount, Constants.TRANSACTION_RECEIVE, wager.id, `wager changed from ${wager.amount} on ${wager.choice} to ${amount} on ${choice}`);
            await this.logTransaction(wager.userId, null, -amount, Constants.TRANSACTION_WITHDRAW, wager.id, `wager changed from ${wager.amount} on ${wager.choice} to ${amount} on ${choice}`);
            return Constants.WAGER_UPDATED;
        }
        else {
            if (amount > bankroll) return Constants.INSUFFICIENT_FUNDS;
            const results = (await execQuery(connection, 'INSERT INTO wager (betId, userId, choice, amount, createdTimestamp, deleted) VALUES (?, ?, ?, ?, ?, 0)', [bet.id, userId, choice, amount, Math.floor(new Date().getTime() / 1000)])).results;
            bankroll -= amount;
            await this.setBankroll(userId, bankroll);
            await this.logTransaction(userId, null, -amount, Constants.TRANSACTION_WITHDRAW, results.insertId, 'wager added');
            return Constants.WAGER_ADDED;
        }
    }
    
    async removeWager(name, userId, bForce = false) {
        let bankroll = await this.getBankroll(userId);
        const bet = await this.getBet(name);
        if (!bet) return Constants.BET_NOT_FOUND;
        if (!bForce && bet.status !== Constants.BET_OPEN) return Constants.BET_IS_CLOSED;
        const wager = await this.getBetWager(bet.id, userId);
        if (!wager) return Constants.WAGER_NOT_FOUND;
        await execQuery(connection, 'UPDATE wager SET deleted = 1 WHERE id = ?', [wager.id]);
        bankroll = bankroll + wager.amount;
        await this.setBankroll(userId, bankroll);
        await this.logTransaction(userId, null, wager.amount, Constants.TRANSACTION_RECEIVE, wager.id, 'wager removed');
        return Constants.WAGER_REMOVED;
    }
    
    async getBetEmbed(client, name) {
        const bet = await this.getBet(name);
        let title = `**${bet.id}. ${bet.name}**`;
        let description = `${bet.status === Constants.BET_OPEN ? 'Open' : 'Closed'}`;
        if (bet.status === Constants.BET_OPEN && bet.lockTimestamp && new Date() < bet.lockTimestamp * 1000) {
            description += ` until ${new Date(bet.lockTimestamp * 1000).toLocaleTimeString('en-US', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'})}`
        }
        const embed = new RichEmbed()
            .setTitle(title)
            .setDescription(description)
            .setColor(0x8c39ca);
        const choices = bet.choices.split(',');
        for (let i = 0; i < choices.length; i++) {
            const choice = choices[i];
            const wagers = [];
            const betWagers = await this.getBetWagers(bet.id);
            for (const wager of betWagers.filter(wager => wager.choice === choice).sort(wagerSorter)) {
                const user = await client.fetchUser(wager.userId);
                wagers.push(`${user.username} $${wager.amount}`);
            }
            embed.addField(`${i+1}. ${choice}`, wagers.length ? wagers.join('\n') : 'None', true);
        }
        return embed;
    }
    
    async transfer(donatorId, amount, recipientId) {
        if (donatorId === recipientId) return Constants.INVALID_RECIPIENT;
        let donatorBankroll = await this.getBankroll(donatorId);
        if (amount > donatorBankroll) return Constants.INSUFFICIENT_FUNDS;
        let recipientBankroll = await this.getBankroll(recipientId);
        donatorBankroll -= amount;
        recipientBankroll += amount;
        await this.setBankroll(donatorId, donatorBankroll);
        await this.setBankroll(recipientId, recipientBankroll);
        await this.logTransaction(donatorId, recipientId, -amount, Constants.TRANSACTION_WITHDRAW, null, 'transfer');
        await this.logTransaction(recipientId, donatorId, amount, Constants.TRANSACTION_RECEIVE, null, 'transfer');
        return Constants.SUCCESS;
    }
    
    async give(amount, recipientId, comment) {
        let recipientBankroll = await this.getBankroll(recipientId);
        recipientBankroll += amount;
        recipientBankroll = Math.max(0, recipientBankroll);
        await this.setBankroll(recipientId, recipientBankroll);
        await this.logTransaction(recipientId, null, amount, Constants.TRANSACTION_RECEIVE, null, comment || 'gift');
        return Constants.SUCCESS;
    }
    
    async getBets() {
        return (await execQuery(connection, 'SELECT * FROM bet WHERE deleted = 0 AND status <> ?', [Constants.BET_ENDED])).results;
    }
    
    async findBet(value) {
        const bets = await this.getBets();
        const name = findInArray(bets.map(bet => bet.name), value);
        if (name) {
            return this.getBet(name);
        }
    }
    
    async findBetByNumberOrName(value) {
        if (!isNaN(value)) {
            const betIndex = parseInt(value);
            const bets = await this.getBets();
            return bets.find(bet => bet.id === betIndex);
        }
        else {
            return this.findBet(value);
        }
    }
    
    findChoiceInBet(value, bet) {
        const choice = findInArray(bet.choices.split(','), value);
        if (choice) {
            return choice;
        }
    }
    
    async findChoiceInBets(value) {
        let error = Constants.INVALID_CHOICE;
        let found = false;
        let choice;
        let bet;
        const bets = await this.getBets();
        for (const _bet of bets) {
            const _choice = this.findChoiceInBet(value, _bet);
            if (_choice) {
                if (!found) {
                    found = true;
                    choice = _choice;
                    bet = _bet;
                    error = null;
                }
                else {
                    error = Constants.AMBIGUOUS_CHOICE;
                    return { choice, bet, error };
                }
            }
        }
        return { choice, bet, error };
    }
}

module.exports = {
    BetManager: new BetManager(),
    Constants: Constants,
};

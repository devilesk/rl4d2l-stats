const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const { findInArray } = require('../common/util');
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
}

const wagerSorter = (wagerA, wagerB) => {
    if (wagerA.amount > wagerB.amount) return -1;
    if (wagerA.amount < wagerB.amount) return 1;
    return 0;
}

class Bet {
    constructor({ name, choices, lockTimestamp, wagers, createdTimestamp, endTimestamp, closeTimestamp }) {
        this.status = Constants.BET_OPEN;
        this.name = name || '';
        this.choices = choices || [];
        this.lockTimestamp = lockTimestamp;
        this.wagers = wagers || [];
        this.winner = '';
        this.createdTimestamp = createdTimestamp || new Date().getTime();
        this.endTimestamp = endTimestamp;
        this.closeTimestamp = closeTimestamp;
    }
    
    clear() {
        this.wagers.length = 0;
    }
    
    open() {
        this.status = Constants.BET_OPEN;
        this.closeTimestamp = null;
    }
    
    close() {
        this.status = Constants.BET_CLOSED;
        this.closeTimestamp = new Date().getTime();
    }
    
    getWager(userId) {
        return this.wagers.find(wager => wager.userId === userId);
    }
    
    addWager(userId, choice, amount) {
        const wager = this.wagers.find(wager => wager.userId === userId);
        if (!wager) {
            this.wagers.push({ userId, choice, amount, createdTimestamp: new Date().getTime() });
            return true;
        }
        return false;
    }
    
    removeWager(userId) {
        this.wagers = this.wagers.filter(wager => wager.userId !== userId);
    }
}

class BetManager {
    constructor() {
        this.lockTimers = {};
        if (fs.pathExistsSync(this.filepath)) {
            this.data = fs.readJsonSync(this.filepath);
            this.data.bets = this.data.bets.map(bet => new Bet(bet));
        }
        else {
            this.data = {
                bankroll: {},
                bets: [],
                history: [],
            };
        }
        for (const bet of this.bets) {
            this.setBetLockTimer(bet);
        }
    }
    
    get filepath() {
        return path.join(__dirname, 'betData.json');
    }
    
    get bankroll() {
        return this.data.bankroll;
    }
    
    get bets() {
        return this.data.bets;
    }
    
    set bets(value) {
        this.data.bets = value;
    }
    
    get history() {
        return this.data.history;
    }
    
    set history(value) {
        this.data.history = value;
    }
    
    async save() {
        await fs.writeJson(this.filepath, this.data);
    }
    
    async getBankroll(userId) {
        if (!this.bankroll.hasOwnProperty(userId)) {
            this.bankroll[userId] = config.settings.bankrollStartingAmount;
            await this.save();
        }
        return this.bankroll[userId];
    }
    
    async setBankroll(userId, amount) {
        this.bankroll[userId] = amount;
        await this.save();
        return Constants.SUCCESS;
    }
    
    getBet(name) {
        return this.bets.find(bet => bet.name === name);
    }
    
    setBetLockTimer(bet) {
        if (bet.lockTimestamp) {
            if (this.lockTimers[bet.name]) {
                clearTimeout(this.lockTimers[bet.name]);
            }
            logger.debug(`setBetLockTimer ${bet.name} now: ${new Date()} lock: ${new Date(bet.lockTimestamp)}. timer: ${bet.lockTimestamp - new Date()}`);
            this.lockTimers[bet.name] = setTimeout(() => {
                bet.close();
                delete this.lockTimers[bet.name];
            }, Math.max(0, bet.lockTimestamp - new Date()));
        }
    }
    
    async setBetLockTimestamp(name, lockTimestamp) {
        let bet = this.getBet(name);
        if (bet) {
            bet.lockTimestamp = lockTimestamp;
            this.setBetLockTimer(bet);
            await this.save();
        }
        return bet;
    }
    
    async addBet(name, choices, lockTimestamp) {
        let bet = this.getBet(name);
        if (!bet) {
            bet = new Bet({ name, choices, lockTimestamp });
            this.bets.push(bet);
            this.setBetLockTimer(bet);
            await this.save();
            return true;
        }
        return false;
    }
    
    async removeBet(name) {
        const bet = this.getBet(name);
        if (!bet) return Constants.BET_NOT_FOUND;
        for (const wager of bet.wagers) {
            bet.removeWager(userId);
            let bankroll = await this.getBankroll(wager.userId);
            bankroll = bankroll + wager.amount;
            await this.setBankroll(wager.userId, bankroll);
        }
        this.bets = this.bets.filter(bet => bet.name !== name);
        if (this.lockTimers[bet.name]) {
            clearTimeout(this.lockTimers[bet.name]);
            delete this.lockTimers[bet.name];
        }
        await this.save();
        return Constants.SUCCESS;
    }
    
    async openBet(name) {
        const bet = this.getBet(name);
        if (!bet) return Constants.BET_NOT_FOUND;
        bet.open();
        await this.save();
        return Constants.SUCCESS;
    }
    
    async closeBet(name) {
        const bet = this.getBet(name);
        if (!bet) return Constants.BET_NOT_FOUND;
        bet.close();
        await this.save();
        return Constants.SUCCESS;
    }
    
    async endBet(name, winner) {
        const bet = this.getBet(name);
        if (!bet) return Constants.BET_NOT_FOUND;
        if (bet.choices.indexOf(winner) === -1) return Constants.INVALID_CHOICE;
        let winners = [];
        let losers = [];
        for (const wager of bet.wagers) {
            let bankroll = await this.getBankroll(wager.userId);
            if (wager.choice === winner) {
                bankroll += 2 * wager.amount;
                winners.push(wager);
            }
            else {
                losers.push(wager);
            }
            await this.setBankroll(wager.userId, bankroll);
        }
        this.bets = this.bets.filter(bet => bet.name !== name);
        bet.winner = winner;
        bet.endTimestamp = new Date().getTime();
        this.history.push(bet);
        if (this.lockTimers[bet.name]) {
            clearTimeout(this.lockTimers[bet.name]);
            delete this.lockTimers[bet.name];
        }
        await this.save();
        
        winners = winners.sort(wagerSorter);
        losers = losers.sort(wagerSorter);
        
        return { winners, losers };
    }
    
    async addWager(name, userId, choice, amount) {
        let bankroll = await this.getBankroll(userId);
        const bet = this.getBet(name);
        if (!bet) return Constants.BET_NOT_FOUND;
        if (bet.status !== Constants.BET_OPEN) return Constants.BET_IS_CLOSED;
        if (bet.choices.indexOf(choice) === -1) return Constants.INVALID_CHOICE;
        const wager = bet.getWager(userId);
        let result;
        if (wager) {
            if (amount > bankroll + wager.amount) return Constants.INSUFFICIENT_FUNDS;
            bet.removeWager(userId);
            bankroll = bankroll + wager.amount - amount;
            result = Constants.WAGER_UPDATED;
        }
        else {
            if (amount > bankroll) return Constants.INSUFFICIENT_FUNDS;
            bankroll -= amount;
            result = Constants.WAGER_ADDED;
        }
        bet.addWager(userId, choice, amount);
        await this.setBankroll(userId, bankroll);
        await this.save();
        return result;
    }
    
    async removeWager(name, userId, bForce = false) {
        let bankroll = await this.getBankroll(userId);
        const bet = this.getBet(name);
        if (!bet) return Constants.BET_NOT_FOUND;
        if (!bForce && bet.status !== Constants.BET_OPEN) return Constants.BET_IS_CLOSED;
        const wager = bet.getWager(userId);
        if (!wager) return Constants.WAGER_NOT_FOUND;
        bet.removeWager(userId);
        bankroll = bankroll + wager.amount;
        await this.setBankroll(userId, bankroll);
        await this.save();
        return Constants.WAGER_REMOVED;
    }
    
    async getBetEmbed(client, name) {
        const bet = this.getBet(name);
        const index = this.bets.indexOf(bet);
        let title = `**${index+1}. ${bet.name}**`;
        let description = `${bet.status === Constants.BET_OPEN ? 'Open' : 'Closed'}`;
        if (bet.status === Constants.BET_OPEN && bet.lockTimestamp && new Date() < bet.lockTimestamp) {
            description += ` until ${new Date(bet.lockTimestamp).toLocaleTimeString('en-US', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'})}`
        }
        const embed = new RichEmbed()
            .setTitle(title)
            .setDescription(description)
            .setColor(0x8c39ca);
        for (let i = 0; i < bet.choices.length; i++) {
            const choice = bet.choices[i];
            const wagers = []
            for (const wager of bet.wagers.filter(wager => wager.choice === choice).sort(wagerSorter)) {
                const user = await client.fetchUser(wager.userId);
                wagers.push(`${user.username} $${wager.amount}`);
            }
            embed.addField(`${i+1}. ${choice}`, wagers.length ? wagers.join('\n') : 'None', true);
        }
        return embed;
    }
    
    async transfer(donatorId, amount, recipientId) {
        let donatorBankroll = await this.getBankroll(donatorId);
        if (amount > donatorBankroll) return Constants.INSUFFICIENT_FUNDS;
        let recipientBankroll = await this.getBankroll(recipientId);
        donatorBankroll -= amount;
        recipientBankroll += amount;
        await this.setBankroll(donatorId, donatorBankroll);
        await this.setBankroll(recipientId, recipientBankroll);
        await this.save();
        return Constants.SUCCESS;
    }
    
    findBet(value) {
        const name = findInArray(this.bets.map(bet => bet.name), value);
        if (name) {
            return this.getBet(name);
        }
    }
    
    findBetByNumberOrName(value) {
        if (!isNaN(value)) {
            const betIndex = parseInt(value) - 1;
            return this.bets[betIndex];
        }
        else {
            return this.findBet(value);
        }
    }
    
    findChoiceInBet(value, bet) {
        const choice = findInArray(bet.choices, value);
        if (choice) {
            return choice
        }
    }
    
    findChoiceInBets(value) {
        let error = Constants.INVALID_CHOICE;
        let found = false;
        let choice;
        let bet;
        for (const _bet of this.bets) {
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

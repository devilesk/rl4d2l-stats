const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } = require('discord.js');
const { exec } = require('child_process');
const config = require('../config');
const fs = require('fs-extra');
const logger = require('../../cli/logger');
const path = require('path');
const connection = require('../connection');
const execQuery = require('../../common/execQuery');
const lastPlayedMapsQuery = require('../lastPlayedMapsQuery');
const formatDate = require('../../common/formatDate');
const { days, hours, timezones } = require('../roleTime');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roletime')
        .setDescription('Set your L4D role times.'),
    async execute(interaction) {
        const { client, user } = interaction;
        if (!(user.id in config.roleSchedule)) {
            config.roleSchedule[user.id] = {
                days: {},
                timezone: 'est',
            }
        }
        const userSchedule = config.roleSchedule[user.id];
        const generateRows = (schedule, selectedDays, selectedTimezones, selectedHours, isFinished, doUpdate) => {
            //console.log('generateRows', selectedDays, selectedTimezones, selectedHours, isFinished, doUpdate);
            const rowDays = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('days')
                        .setPlaceholder('Select days')
                        .setMinValues(0)
                        .setMaxValues(7)
                        .addOptions(days.map(day => ({
                            label: day.charAt(0).toUpperCase() + day.slice(1),
                            description: '',
                            value: day,
                            default: !doUpdate && selectedDays.indexOf(day) !== -1
                        }))),
                );
            const rowTimezone = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('timezones')
                        .setPlaceholder('Select time zone')
                        .setMinValues(1)
                        .setMaxValues(1)
                        .addOptions(timezones.map(timezone => ({
                            label: timezone.toUpperCase(),
                            description: '',
                            value: timezone,
                            default: selectedTimezones.indexOf(timezone) !== -1
                        }))),
                );
            
            const getHourLabel = hour => {
                const startHour = hour;
                const endHour = (hour === '23' ? '24' : hours[parseInt(hour) + 1]);
                return `${startHour}:00-${endHour}:00`;
            };
            
            const rowHours = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('hours')
                        .setPlaceholder('Select hours')
                        .setMinValues(0)
                        .setMaxValues(24)
                        .addOptions(hours.map(hour => {
                            return {
                                label: getHourLabel(hour),
                                description: '',
                                value: hour.toString(),
                                default: !doUpdate && selectedHours.indexOf(hour.toString()) !== -1
                            }
                        })),
                );
            
            const rowButtons = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('enter')
                        .setLabel('Enter')
                        .setStyle('SUCCESS'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('close')
                        .setLabel('Close')
                        .setStyle('DANGER'),
                );
                
            if (doUpdate) {
                for (day of selectedDays) {
                    if (!(day in schedule['days'])) {
                        if (selectedHours.length) schedule['days'][day] = [...selectedHours];
                    }
                    else {
                        if (!selectedHours.length) {
                            delete schedule['days'][day];
                        }
                        else {
                            schedule['days'][day] = [...selectedHours];
                        }
                    }
                }
                for (timezone of selectedTimezones) {
                    schedule['timezone'] = timezone;
                }
            }
                
            let components = [];
            if (!isFinished) {
                components = [rowTimezone, rowDays, rowHours, rowButtons];
            }
            
            const prettyHours = dayHours => {
                if (dayHours.length === 1) {
                    return getHourLabel(dayHours[0]);
                }
                const ranges = [[dayHours[0]]];
                for (let i = 1; i < dayHours.length; i++) {
                    const dayHour = dayHours[i];
                    if (parseInt(ranges.at(-1).at(-1)) === parseInt(dayHour) - 1) {
                        ranges.at(-1).push(dayHour);
                    }
                    else {
                        ranges.push([dayHour]);
                    }
                }
                return ranges.map(range => {
                    if (range.length === 1) {
                        return getHourLabel(range[0]);
                    }
                    else {
                        const startHour = range[0];
                        const endHour = parseInt(range.at(-1)) + 1;
                        return `${startHour}:00-${endHour}:00`;
                    }
                }).join(', ');
            }
            
            const fields = [];
            for ([day, dayHours] of Object.entries(schedule['days'])) {
                const dayTitle = day.charAt(0).toUpperCase() + day.slice(1);
                const dayValues = prettyHours(dayHours);
                //logger.debug(`${dayTitle} ${dayValues}`);
                if (dayValues) {
                    fields.push({
                        name: dayTitle,
                        value: dayValues,
                    });
                }
            }
            
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('L4D Role Times')
                .setDescription('Select days and times to get the role.')
                .addFields(fields)
                .setFooter({ text: `Timezone: ${schedule['timezone'].toUpperCase()}` });
            
            return { ephemeral: true, embeds: [embed], components: components };
        };
        let selectedDays = [], selectedTimezones = [userSchedule['timezone']], selectedHours = [];
        let data = generateRows(userSchedule, selectedDays, selectedTimezones, selectedHours, false, true);

        await interaction.reply(data);
        const message = await interaction.fetchReply()
        
        const collectorSelectMenu = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 15 * 60 * 1000 });
        collectorSelectMenu.on('collect', async menuInteraction => {
            if (menuInteraction.user.id === interaction.user.id) {
                switch (menuInteraction.customId) {
                    case 'days':
                        selectedDays = menuInteraction.values
                    break;
                    case 'timezones':
                        selectedTimezones = menuInteraction.values
                    break;
                    case 'hours':
                        selectedHours = menuInteraction.values
                    break;
                }
                data = generateRows(userSchedule, selectedDays, selectedTimezones, selectedHours, false, false);
                await menuInteraction.update(data);
            }
        });
        
        const collectorButton = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 15 * 60 * 1000 });
        collectorButton.on('collect', async buttonInteraction => {
            if (buttonInteraction.user.id === interaction.user.id) {
                data = generateRows(userSchedule, selectedDays, selectedTimezones, selectedHours, buttonInteraction.customId === 'close', buttonInteraction.customId === 'enter');
                switch (buttonInteraction.customId) {
                    case 'enter':
                        selectedDays = [];
                        //selectedTimezones = [];
                        selectedHours = [];
                        await config.saveRoleSchedule();
                    break;
                    case 'close':
                        collectorSelectMenu.stop();
                        collectorButton.stop();
                    break;
                }
                await buttonInteraction.update(data);
            }
        });


    },
};
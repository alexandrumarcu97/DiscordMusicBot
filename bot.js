const { Client, GatewayIntentBits } = require('discord.js');
const play = require('play-dl');
const {
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
	NoSubscriberBehavior,
	AudioPlayerStatus,
} = require('@discordjs/voice');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
	],
});

const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
	},
});

const token = 'MTA0OTY2ODkwODUzOTQ2MTcwMw.GXO_UC.rUVqLjBYldl5aNz1D7wNrCwzFueeTuwcYZrqGg';

let queue = [];

let currentMessage;

client.on('messageCreate', async (message) => {
	currentMessage = message;
	if (message.content.startsWith('-play')) {
		const connection = joinVoiceChannel({
			channelId: message.member.voice.channel.id,
			guildId: message.guild.id,
			adapterCreator: message.guild.voiceAdapterCreator,
		});

		let args = message.content.split('play')[1];
		let yt_info = await play.search(args, {
			limit: 1,
		});
		let stream = await play.stream(yt_info[0].url);

		let resource = createAudioResource(stream.stream, {
			inputType: stream.type,
		});
		queue.push({ resource: resource, title: yt_info[0].title });
		if (player.state.status == 'idle') {
			playNext(currentMessage);
		} else {
			message.channel.send(`:ballot_box_with_check: Added: ${yt_info[0].title} to the queue`);
		}

		connection.subscribe(player);
	} else if (message.content === '-skip') {
		if (queue.length == 0) {
			message.channel.send('Your queue is empty. Player will be stopped.');
			player.stop();
		} else {
			message.channel.send(`:track_next: Skipping`);
			player.stop();
		}
	} else if (message.content === '-pause') {
		message.channel.send(`:pause_button: Paused`);
		player.pause();
	} else if (message.content === '-resume') {
		message.channel.send(`:arrow_forward: Resumed`);
		player.unpause();
	} else if (message.content === '-stop') {
		message.channel.send(`:stop_button: Player stopped`);
		player.stop();
	} else if (message.content === '-leave') {
		joinVoiceChannel({
			channelId: message.member.voice.channel.id,
			guildId: message.guild.id,
			adapterCreator: message.guild.voiceAdapterCreator,
		}).disconnect();
		message.channel.send(`:x: Disconnected`);
	} else if (message.content === '-queue') {
		if (queue.length === 0) {
			message.channel.send('Your queue is empty.');
		} else {
			let items = queue.map((e, index) => `${index + 1}. ${e.title}`).join('\n');
			message.channel.send(items);
		}
	}
});

player.on(AudioPlayerStatus.Idle, playNext);

function playNext() {
	if (queue.length > 0) {
		let next = queue.shift();
		player.play(next.resource);
		currentMessage.channel.send(`:white_check_mark: Now playing: ${next.title}`);
	}
}

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.login(token);

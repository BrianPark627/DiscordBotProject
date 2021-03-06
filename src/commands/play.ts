import * as Discord from "discord.js";
import {IBotCommand} from "../api";
import * as YTDL from "ytdl-core-discord";
import * as yt_search from "yt-search";
import {servers} from "../index";

async function parse(args: string[]) {
  var patt = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
  var link:string;
  if (patt.test(args[0])) {
    // it is a youtube link
    link = args[0];
  } else {
    //now search Youtube
    var searchQuery = args.join(' ');
    // yt_search(searchQuery,(err,r) => {
    //   const videos = r.videos;
    //   const url = videos[0].url;
    // });
    const r = await yt_search(searchQuery);
    link = r.videos[0].url;
  }
  return link;
}

async function Play(connection: Discord.VoiceConnection, msgObject: Discord.Message, url:string) {
  var server: { queue?: string[], dispatcher?: Discord.StreamDispatcher } = servers[msgObject.guild.id];

  try {
    // let stream = YTDL(server.queue[0], { filter: "audioonly" });
    // stream.on("error", e => {
    //   console.error(e);
    // })
    // server.dispatcher = connection.play(stream);
    server.dispatcher = connection.play(await YTDL(url, { filter: 'audioonly', quality: 'highest', highWaterMark: 1 << 25 }), { type: 'opus' });
    //console.log(msgObject.guild.voice);
  }
  catch (error) {
    msgObject.reply("That isn't a working Youtube link, moving on");
    //server.queue.shift();
    if (!servers[msgObject.guild.id].queue[0]) {
      connection.disconnect();

    }
  }

  // shift() will move all to the left in array indices
  var endSong: string = server.queue.shift();
  if (looping) {
    server.queue.push(endSong);
  }
  server.dispatcher.on("error", (e) => {
    console.log(e);
    if (server.queue[0]) {
      Play(connection, msgObject);
    } else {
      connection.disconnect();

    }

  });
  server.dispatcher.on("finish", () => {
    msgObject.channel.send("Finished playing song");
    if (server.queue[0]) {
      Play(connection, msgObject);
    } else {

      connection.disconnect();

    }
  })
}

export default class play implements IBotCommand {

  private readonly _command = "play"

  help(): string {
    return "uwu. This command isn't fuwwy impwemented";
  }
  isThisCommand(command: string): boolean {
    return command === this._command;
  }
  async runCommand(args: string[], msgObject: Discord.Message, client: Discord.Client): Promise<void> {
    if (msgObject.member.voice.channel) {
      console.log("1")
      // Check if bot is already in a voice connection

      if (!msgObject.guild.voice || msgObject.guild.voice.channelID == null) {
        console.log("2")
        // if an entry for the server that the message was sent from is not present in the servers list
        if (!servers[msgObject.guild.id]) {
          console.log("3")
          // if the server does not exist yet in server list, put it in list and initialize the queue to be an empty string
          servers[msgObject.guild.id] = { queue: [] };
        }
        // Once all that is done, bot joins a voice channel and passes the arguments (which is the youtube url) to server queue

        if (args[0]) { //used to check if theres a link
          console.log("4")
          const connection = await msgObject.member.voice.channel.join();
          // TODO: parse arguments and play
          const url = parse(args);

          console.log("5");
          // call function to download video from the queue
          // Play(await connection, msgObject);
        }

        else {
          msgObject.reply("You didn't give me a link");
        }
      }
      else {
        // if (!servers[msgObject.guild.id].dispatcher.paused) {
        //   if (args[0]) {
        //     // 'nother function'
        //     msgObject.reply("Added a song to queue");
        //   }
        // } else {
        //   servers[msgObject.guild.id].dispatcher.resume()
        //   if (args[0]) {
        //
        //     msgObject.reply("Added a song to queue");
        //   }
        // }
        // TODO: parse and then play using guild.voice.connection.play(ytdl)
      }
    } else {
      // you need to be in a voice channel
      msgObject.reply("You need to be in a voice channel");
    }
  }

}

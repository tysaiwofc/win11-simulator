const RPC = require('discord-rpc');

class DiscordRichPresence {
  constructor(clientId, version) {
    this.clientId = clientId;
    this.version = version;
    this.rpc = new RPC.Client({ transport: 'ipc' });

    this.rpc.on('ready', this.setActivity.bind(this));
  }

  async connect() {
    try {
      await this.rpc.login({ clientId: this.clientId });
      console.log('Rich Presence conectado!');
    } catch (error) {
      console.error('Erro ao conectar o Rich Presence:', error);
    }
  }

  setActivity() {
    this.rpc.setActivity({
      details: 'Um simulador de windows perfeito',
      state: `Versão v${this.version}`,
      startTimestamp: new Date(),
      largeImageKey: 'windows',
      largeImageText: 'Windows 11 Simulator',
      instance: false,
    });
  }
}

module.exports = DiscordRichPresence;

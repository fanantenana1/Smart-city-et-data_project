export class WebSocketService {
  constructor(url) {
    this.url = url;
    this.ws = null;
  }
  
  connect(onMessage) {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (event) => {
      onMessage(JSON.parse(event.data));
    };
  }
  
  disconnect() {
    if (this.ws) this.ws.close();
  }
}
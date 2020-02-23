// @ts-nocheck
// Set tracker URL
const TRACKER = 'localhost:8000';

class P2P {
    constructor() {
        // Create seed map (id, peer)
        this.seeds = new Map();

        // Init connection
        this.socket = io(TRACKER);
        this.socket.on('connect', () => {
            // Hook signal server onto socket
            this.tracker = new SimpleSignalClient(this.socket);

            console.log('Connection established:', this.tracker);

            // Log errors
            this.socket.on('error', this.onError.bind(this));

            // On tracker request, accept and handle peer
            this.tracker.on('request', this.onRequest.bind(this));

            // On tracker discovery, connect to peers
            this.tracker.on('discover', this.onDiscover.bind(this));

            // Get initial peers
            this.discover();
        });
    }

    discover() {
        console.log('Requesting peers');

        // Discover peers on server
        this.tracker.discover({
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
                ]
            },
            stream: false,
            trickle: true
        });
    }

    onDiscover(data) {
        console.log('Discovery', data);

        // Connect to each discovered peer returned from server
        data.peers.forEach(id => this.connectToPeer(id));
    }

    // Initiate peer connection
    async connectToPeer(id) {
        // Don't request connection to self
        if (id === this.socket.id || !id) return;

        // log peer and connect
        console.log('Connecting to peer', id);
        const { peer, metadata } = await this.tracker.connect(id, { id: this.socket.id });

        // handle peer after connection
        console.log('Connected to peer', peer, metadata);
        this.onPeer(peer, id);
    }

    // Handle connect request
    async onRequest(request) {
        // Accept request and handle peer after connection
        const { peer, metadata } = await request.accept();
        console.log('Connected to peer', peer, metadata);
        this.onPeer(peer, metadata.id);
    }

    // Handle peer data
    onPeer (peer, id) {
        // Handle peer connect
        peer.on('connect', () => {
            console.log('Peer connected, saving', id, peer);
            this.seeds.set(id, peer);
            this.broadcast('BROADCAST_PEER', {
                message: `New connection from peer`,
                metadata: {
                    from: this.socket.id,
                    id
                }
            });
        });

        // Handle peer data
        peer.on('signal', data => console.log('Peer:', peer, '\nSignal data:', data));
        peer.on('stream', data => console.log('Peer:', peer, '\Stream data:', data));
        peer.on('data', (message) => {
            console.log('New peer message');
            const payload = P2P.dataToObject(message);

            switch (payload.type) {
                case 'TEST':
                    console.log('Peer:', peer, '\nPayload:', payload);
                    break;

                case 'BROADCAST_PEER':
                default:
                    console.log('Peer:', peer, '\nPayload:', payload);
                    console.log('Connected ID:', payload.data.metadata);
                    console.log('Known:', this.seeds.has(payload.data.metadata.id) || this.socket.id === payload.data.metadata.id);

                    // Connect to seed if not in seed list
                    if (this.seeds.has(payload.data.metadata.id) || this.socket.id === payload.data.metadata.id) {
                        return;
                    }
                    this.connectToPeer(payload.data.metadata.id);
                    break;
            }
        });

        // Handle peer error
        peer.on('error', err => console.warn('Peer error', err));

        // Handle peer close
        peer.on('close', () => this.seeds.delete(id));
    }

    // Warn errors
    onError(err) {
        console.warn(err)
    }

    // Convert Uint8Array buffer to object
    static dataToObject (data) {
        return JSON.parse(new TextDecoder('utf-8').decode(data));
    }

    // Send data to all peers
    broadcast(type, data) {
        this.seeds.forEach((p) => p.send(JSON.stringify({ type, data })));
    }

    // Send data to specified peer
    send(id, type, data) {
        const peer = this.seeds.get(id);
        peer.send(JSON.stringify({ type, data }));
    }
}

// Create p2p connection
const p2p = new P2P();

// DEBUG: Test functions
setInterval(() => p2p.broadcast('TEST', { from: p2p.socket.id, datetime: new Date().toISOString()}), 5000);
setInterval(() => console.log('Peers', p2p.seeds.size, p2p.seeds), 8000);

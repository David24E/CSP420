import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import PropTypes from 'prop-types';
import Peer from "simple-peer";
import { AppBar, Box, Button, Card, CardActions, CardContent, CardHeader, CssBaseline, Divider, Drawer, Modal, Tab, Tabs, TextField, Toolbar, Typography } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import UsersList from "../components/userCommsSection/usersList/usersList";
import TextChatComms from "../components/userCommsSection/textChatComms/textChatComms";
import VideoChatComms from "../components/userCommsSection/videoChatComms/videoChatComms";

const drawerWidth = 425;

const useStyles = makeStyles((theme) => ({
    root: {
        minWidth: '100%',
        minHeight: '100vh',
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    drawerContainer: {
        overflow: 'auto',
    },
    content: {
        flexGrow: 1,
        height: '100%',
        padding: theme.spacing(3),
        width: `calc(100% - ${drawerWidth}px)`,
        marginRight: drawerWidth,
    },
    paper: {
        width: 400,
        position: 'absolute',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
        backgroundColor: theme.palette.background.paper,
    },
    modalButton: {
        right: -310,
        marginTop: 22
    },
}));

function getModalStyle() {
    const top = 50;
    const left = 50;

    return {
        top: `${top}%`,
        left: `${left}%`,
        transform: `translate(-${top}%, -${left}%)`,
    };
}

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={2}>
                    {children}
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

const Room = (props) => {
    const classes = useStyles();
    const [modalStyle] = React.useState(getModalStyle);

    const socketRef = useRef();
    const peersRef = useRef([]);
    const youtubePlayer = useRef();
    const userVideoRef = useRef();

    const roomID = props.match.params.roomID;

    const [peers, setPeers] = useState([]);
    const [yourID, setYourID] = useState('');
    const [yourUser, setYourUser] = useState();
    const [message, setMessage] = useState('');
    const [videoID, setVideoID] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentTab, setCurrentTab] = useState(0);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [yourNickname, setYourNickname] = useState('');
    const [roomConfig, setRoomConfig] = useState({ roomName: `${roomID}`, roomComms: 'Text Chat', roomType: 'Watch Together' });
    const [nicknameFieldError, setNicknameFieldError] = useState(false);
    const [isMainReady, setIsMainReady] = useState(false);


    useEffect(() => {
        fetch(`/room/${roomID}`).then((response) => {
            return response.json();
        }).then((data) => {
            // this.setState({items: data.items});
            console.log('data' + data);
            console.dir(data);
            setRoomConfig(data);
        });
        /* .catch((err) => {
            throw new Error(err);
        }); */
    }, [roomID]);


    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            // socketRef.current = io.connect("/");
            socketRef.current = io({ autoConnect: false });

            if (userVideoRef.current) {
                userVideoRef.current.srcObject = stream;
            }

            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(user => {
                    const peer = createPeer(user.id, socketRef.current.id, socketRef.current.nickname, stream);
                    peersRef.current.push({
                        peerID: user.id,
                        peerNickname: user.nickname,
                        peer,
                    })
                    peers.push({
                        peerID: user.id,
                        peerNickname: user.nickname,
                        peer
                    });
                })

                setPeers(peers);
            })

            socketRef.current.on("user joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                // remove?
                // peer.signal(payload.signal);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peerNickname: payload.callerNickname,
                    peer,
                })

                const peerObj = {
                    peerID: payload.callerID,
                    peerNickname: payload.callerNickname,
                    peer,
                }

                setPeers(users => [...users, peerObj]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socketRef.current.on("room full", () => {
                alert("room is full");
            })

            socketRef.current.on('your id', id => {
                setYourID(id);
            })

            socketRef.current.on('all users in room', users => {
                users.sort((a, b) => { return b.nickname - a.nickname });

                users.some((user, idx) =>
                    user.id === socketRef.current.id &&
                    users.unshift(
                        users.splice(idx, 1)[0]
                    )
                )

                const currentUser = users.find(user => user.id === socketRef.current.id);
                if (currentUser) {
                    currentUser.nickname = `${currentUser.nickname}(You)`;
                }

                console.log('all users in room start users ');
                console.dir(usersInRoom);
                console.log('all users in room start PeersRef ');
                console.dir(peersRef);

                if (peersRef.current.length > 0) {
                    for (const user of users) {
                        const tempPeer = peersRef.current.find((peer) => !peer.peerNickname && (peer.peerID === user.id));
                        if (tempPeer) {
                            tempPeer.peerNickname = user.nickname;
                        }
                    }
                }

                console.log('all users in room end users ');
                console.dir(users);
                console.log('all users in room end PeersRef ');
                console.dir(peersRef);

                setUsersInRoom(users);
            })

            socketRef.current.on("message", (message) => {
                receivedMessage(message);
            })

            socketRef.current.on('user left', id => {
                const peerObj = peersRef.current.find(p => p.peerID === id);
                console.log('user leaving... ');
                console.dir(peerObj);

                if (peerObj) {
                    peerObj.peer.destroy();
                }

                const peers = peersRef.current.filter(p => p.peerID !== id);
                peersRef.current = peers;

                console.log('user left end PeersRef ');
                console.dir(peersRef);
                console.log('user left end Peers ');
                console.dir(peers);

                socketRef.current.emit("all users in room");

                setPeers(peers);
            })

        })
    }, []);


    useEffect(() => {
        console.log('USE EFFECT LAUNCHED');
        if (isMainReady) {
            console.log('USE EFFECT LAUNCHED');
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = loadVideoPlayer;
        }
    }, [isMainReady]);

    const receivedMessage = (message) => {
        setMessages(oldMsgs => [...oldMsgs, message]);
        console.log("receivedMessage ", messages);
    }

    const sendMessage = (e) => {
        e.preventDefault();

        const messageObject = {
            body: message,
            id: yourID,
            nickname: yourNickname,
        };
        setMessage("");
        socketRef.current.emit("send message", messageObject);
    }

    const handleChange = (e) => {
        setMessage(e.target.value);
    }


    function handleTabChange(e, newValue) {
        socketRef.current.on("all users", users => {
            users.forEach(user => {
                peersRef.current = [...peersRef.current, { id: user.id, nickname: user.nickname }]
            })
        })

        setCurrentTab(newValue)
    }

    function loadVideoPlayer() {
        const player = new window.YT.Player('player', {
            height: '390',
            width: '640',
        });

        youtubePlayer.current = player;
    }

    function stopVideo() {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "pause" }));
            youtubePlayer.current.pauseVideo();
        }
    }

    function playVideo() {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "play" }));
            youtubePlayer.current.playVideo();
        }
    }

    function loadVideo() {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "newVideo", data: videoID }));
            youtubePlayer.current.loadVideoById(videoID.split("=")[1]);
        }
    }

    function createPeer(userToSignal, callerID, callerNickname, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, callerNickname, roomID, signal })
        });

        peer.on("data", handleData);

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID, roomID })
        });

        peer.on("data", handleData);

        peer.signal(incomingSignal);
        return peer;
    }

    function handleStream(stream) {
        console.log('handleStream called')
        // partnerVideo.current.srcObject = stream;
    }

    function handleData(data) {
        const parsed = JSON.parse(data);
        if (parsed.type === "newVideo") {
            youtubePlayer.current.loadVideoById(parsed.data.split("=")[1]);
        } else if (parsed.type === "pause") {
            youtubePlayer.current.pauseVideo();
        } else {
            youtubePlayer.current.playVideo();
        }
    }

    function handleModalSubmit(e) {
        e.preventDefault();
        const yourUserState = { id: yourID, nickname: yourNickname };

        socketRef.current.connect();

        socketRef.current.emit("join room", { roomID, nickname: yourNickname }, (data) => {
            if (data) {
                navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
                    if (userVideoRef.current) {
                        userVideoRef.current.srcObject = stream;
                    }
                })
                setIsMainReady(true);
                setYourUser(yourUserState);
            } else {
                setNicknameFieldError(true);
            }
        });
    }

    function handleModalTextFieldChange(e) {
        const { value } = e.target;
        setYourNickname(value);
    }

    return (
        <>

            {!yourUser ?
                <Card style={modalStyle} className={classes.paper}>
                    <CardHeader title='Please enter a username' />
                    <Divider />
                    <form noValidate autoComplete="off" onSubmit={handleModalSubmit} >
                        <CardContent>
                            <TextField
                                name="username"
                                fullWidth
                                autoFocus
                                value={yourNickname}
                                error={nicknameFieldError}
                                onChange={handleModalTextFieldChange}
                                label="your username"
                                helperText={nicknameFieldError ? 'That username is not available. Please enter another' : ''}
                                required
                            />
                        </CardContent>
                        <CardActions>
                            <Button variant="contained" color="primary" className={classes.modalButton} type="submit" disabled={!yourNickname}>Done</Button>
                        </CardActions>
                    </form>
                </Card>

                :

                <div className={classes.root}>
                    <CssBaseline />
                    <AppBar position="fixed" className={classes.appBar}>
                        <Toolbar>
                            <Typography variant="h6" noWrap>
                                CoVideo
                        </Typography>
                        </Toolbar>
                    </AppBar>
                    <main className={classes.content}>
                        <Toolbar />

                        <div id="player" />
                        <br/>
                        <button onClick={stopVideo}>Stop Video</button>
                        <button onClick={playVideo}>Play Video</button>
                        <input type="text" placeholder="video link" value={videoID} onChange={e => setVideoID(e.target.value)} />
                        <button onClick={loadVideo}>Load video</button>

                    </main>
                    <Drawer
                        className={classes.drawer}
                        variant="permanent"
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                        anchor='right'
                    >
                        <div className={classes.drawerContainer}>
                            <Toolbar />
                            <Tabs
                                value={currentTab}
                                onChange={handleTabChange}
                                indicatorColor="primary"
                                textColor="primary"
                                variant="fullWidth"
                                aria-label="full width tabs example"
                            >
                                <Tab label="Chat" />
                                <Tab label={`People (${usersInRoom.length})`} />
                            </Tabs>

                            <TabPanel value={currentTab} index={0}>
                                {
                                    roomConfig.roomComms === 'Text Chat' ?
                                        <TextChatComms messages={messages} yourID={yourID} message={message} handleChange={handleChange} sendMessage={sendMessage} />
                                        :
                                        <VideoChatComms peers={(peersRef.current)} />
                                }
                            </TabPanel>
                            <TabPanel value={currentTab} index={1}>
                                <UsersList key={usersInRoom.length} usersInRoom={usersInRoom} />
                            </TabPanel>

                        </div>
                    </Drawer>
                </div>
            }
        </>
    );
};

export default Room;
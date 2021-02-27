import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import PropTypes from 'prop-types';
import Peer from "simple-peer";
import { AppBar, Box, Button, Card, CardActions, CardContent, CardHeader, Checkbox, CssBaseline, Divider, Drawer, Grid, LinearProgress, Modal, Slider, Tab, Tabs, TextField, Toolbar, Typography } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import UsersList from "../components/userCommsSection/usersList/UsersList";
import TextChatComms from "../components/userCommsSection/textChatComms/TextChatComms";
import VideoChatComms from "../components/userCommsSection/videoChatComms/VideoChatComms";
import ReactPlayer from "react-player";
import moment from "moment";

const drawerWidth = '40%';

const useStyles = makeStyles((theme) => ({
    root: {
        minWidth: '100%',
        minHeight: '100vh',
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    title: {
        flexGrow: 1,
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
    videoCenterControls: {
        width: '90%',
    },
    playerWrapper: {
        width: 640,
        height: 360,
    },
    reactPlayerStyle: {
        marginBottom: 10,
        background: 'rgba(0, 0, 0, .1)',
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
    const userVideoRef = useRef();
    const reactPlayer = useRef();

    const roomID = props.match.params.roomID;

    const [peers, setPeers] = useState([]);
    const [yourID, setYourID] = useState('');
    const [yourUser, setYourUser] = useState();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentTab, setCurrentTab] = useState(0);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [yourNickname, setYourNickname] = useState('');
    const [roomConfig, setRoomConfig] = useState({ roomName: `${roomID}`, roomComms: 'Text Chat', roomType: 'Watch Together' });
    const [nicknameFieldError, setNicknameFieldError] = useState(false);

    const [url, setUrl] = useState(null);
    const [videoID, setVideoID] = useState("");
    const [playing, setplaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [muted, setMuted] = useState(false);
    const [played, setPlayed] = useState(0);
    const [loaded, setLoaded] = useState(0);
    const [seeking, setSeeking] = useState(false);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1.0);

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
                setYourUser(currentUser);

                if (peersRef.current.length > 0) {
                    for (const user of users) {
                        const tempPeer = peersRef.current.find((peer) => !peer.peerNickname && (peer.peerID === user.id));
                        if (tempPeer) {
                            tempPeer.peerNickname = user.nickname;
                            tempPeer.hostUser = user.hostUser;
                        }
                    }
                }

                setUsersInRoom(users);
            })

            socketRef.current.on("message", (message) => {
                receivedMessage(message);
            })

            socketRef.current.on('user left', id => {
                const peerObj = peersRef.current.find(p => p.peerID === id);

                if (peerObj) {
                    peerObj.peer.destroy();
                }

                const peers = peersRef.current.filter(p => p.peerID !== id);
                peersRef.current = peers;

                socketRef.current.emit("all users in room");

                setPeers(peers);
            })

        })
    }, []);
    
    const receivedMessage = (message) => {
        setMessages(oldMsgs => [...oldMsgs, message]);
    }

    const sendMessage = (e) => {
        e.preventDefault();

        const messageObject = {
            body: message,
            id: yourID,
            nickname: yourNickname,
            time: moment().format('h:mm a')
        };
        setMessage("");
        socketRef.current.emit("send message", messageObject);
    }

    const handleChange = (e) => {
        setMessage(e.target.value);
    }


    const handleTabChange = (e, newValue) => {
        socketRef.current.on("all users", users => {
            users.forEach(user => {
                peersRef.current = [...peersRef.current, { id: user.id, nickname: user.nickname }]
            })
        })

        setCurrentTab(newValue)
    }
    
    const createPeer = (userToSignal, callerID, callerNickname, stream) => {
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

    const addPeer = (incomingSignal, callerID, stream) => {
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

    const load = url => {
        setUrl(url);
        setVideoID(url);
        setPlayed(0);
        setLoaded(0);
    }

    const handlePlayPause = () => {
        setplaying(prevPlaying => !prevPlaying)
    }

    const handleStart = () => {
        setplaying(true);
    }

    const handleStop = () => {
        setUrl(null);
        setplaying(false);
    }

    const handleVolumeChange = (e, newValue) => {
        setVolume(newValue);
    }

    const handleToggleMuted = () => {
        setMuted(prevMuted => !prevMuted);
    }

    const handleSetPlaybackRate = e => {
        setPlaybackRate(e.target.value);
    }

    const handlePlay = () => {
        setplaying(true);
    }

    const handlePause = () => {
        setplaying(false);
    }

    const handleSeekChange = (e, newValue) => {
        setPlayed(newValue);
    }

    const handleSeekMouseUp = (e, newValue) => {
        setSeeking(false);
        reactPlayer.current.seekTo((newValue), 'fraction');
    }

    const handleProgress = state => {
        // We only want to update time slider if we are not currently seeking
        if (!seeking) {
            setPlayed((state.played));
            setLoaded((state.loaded));
        }
    }

    const handleEnded = () => {
        console.log('onEnded')
    }

    const handleDuration = (duration) => {
        console.log('onDuration', duration)
        setDuration(duration)
    }


    const stopVideo = () => {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "stop" }));
        }
        handleStop();
    }

    const startVideo = () => {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "start" }));
        }
        handleStart();
    }

    const pauseVideo = () => {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "pause" }));
        }
        handlePause();
    }

    const playVideo = () => {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "play" }));
        }
        handlePlay();
    }

    const playOrPauseVideo = () => {
        for (const peerRef of peersRef.current) {
            if (playing) {
                peerRef.peer.send(JSON.stringify({ type: "pause" }));
            } else if (!playing) {
                peerRef.peer.send(JSON.stringify({ type: "play" }));
            }
        }
        handlePlayPause();
    }

    const seekChangeVideo = (e) => {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "seekChange", data: e.target.value }));
        }
        handleSeekChange((e.target.value));
    }

    const playbackRateChangeVideo = (e) => {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "playbackRateChange", data: e.target.value }));
        }
        handleSetPlaybackRate((e.target.value));
    }

    const loadVideo = () => {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "newVideo", data: videoID }));
        }
        load(videoID);
    }

    function handleData(data) {
        const parsed = JSON.parse(data);

        if (parsed.type === "newVideo") {
            load(parsed.data);
        } else if (parsed.type === "start") {
            handleStart();
        } else if (parsed.type === "pause") {
            handlePause();
        } else if (parsed.type === "play") {
            handlePlay();
        } else if (parsed.type === "seekChange") {
            handleSeekChange(parsed);
        } else if (parsed.type === "playbackRateChange") {
            handleSetPlaybackRate(parsed);
        } else if (parsed.type === "stop") {
            handleStop();
        }
    }

    const handleModalSubmit = (e) => {
        e.preventDefault();
        const yourUserState = { id: yourID, nickname: yourNickname };

        socketRef.current.connect();

        socketRef.current.emit("join room", { roomID, nickname: yourNickname }, (uniqueNickname, hostRoom) => {
            if (uniqueNickname) {
                navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
                    if (userVideoRef.current) {
                        userVideoRef.current.srcObject = stream;
                    }
                })

                setRoomConfig(hostRoom);
                setYourUser(yourUserState);
            } else {
                setNicknameFieldError(true);
            }
        });
    }

    const handleModalTextFieldChange = (e) => {
        const { value } = e.target;
        setYourNickname(value);
    }

    const leaveRoom = () => {
        socketRef.current.close();
        props.history.push(`/`);
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
                            <Typography variant="h6" className={classes.title} noWrap>
                                CoVideo
                            </Typography>
                            <Button variant="contained" color="primary" type="submit" disableElevation onClick={leaveRoom}>Leave Room</Button>
                        </Toolbar>
                    </AppBar>
                    <main className={classes.content}>
                        <Toolbar />

                        <div>
                            <div className={classes.playerWrapper}>
                                <div className={classes.reactPlayerStyle}>
                                    <ReactPlayer
                                        config={{
                                            youtube: {
                                                playerVars: {
                                                    modestbranding: 1,
                                                    disablekb: 1
                                                }
                                            },
                                        }}
                                        url={url}
                                        ref={reactPlayer}
                                        pip={false}
                                        playing={playing}
                                        controls={false}
                                        light={false}
                                        loop={false}
                                        playbackRate={playbackRate}
                                        volume={(volume)}
                                        muted={muted}
                                        onReady={() => console.log('onReady')}
                                        onStart={startVideo}
                                        onPlay={playVideo}
                                        onPause={pauseVideo}
                                        onBuffer={() => console.log('onBuffer')}
                                        onSeek={seekChangeVideo}
                                        onEnded={handleEnded}
                                        onError={e => console.log('onError', e)}
                                        onProgress={handleProgress}
                                        onDuration={handleDuration}
                                    />
                                </div>
                            </div>

                            {(roomConfig.roomType === 'Broadcast' && yourUser.hostUser) || roomConfig.roomType === 'Watch Together' ?
                                <div style={{ marginLeft: 150 }}>
                                    <button onClick={stopVideo} disabled={url ? false : true}>Stop</button>
                                    <button onClick={playOrPauseVideo} disabled={url ? false : true}>{playing ? 'Pause' : 'Play'}</button>
                                    <input value={videoID} onChange={e => setVideoID(e.target.value)} type='text' placeholder='Enter URL' />
                                    <button onClick={loadVideo}>Load video</button>

                                    <br />
                                    <br />
                                </div>
                                :
                                ''
                            }

                            {url && ((roomConfig.roomType === 'Broadcast' && yourUser.hostUser) || roomConfig.roomType === 'Watch Together') ?
                                <div className={classes.videoCenterControls}>
                                    <Grid container spacing={2}>
                                        <Grid container xs={2} justify={'flex-end'}>
                                            <Grid item>
                                                <p>
                                                    Speed
                                                </p>
                                            </Grid>
                                        </Grid>
                                        <Grid container xs={4} spacing={1}>
                                            <Grid item style={{ marginLeft: 15, paddingTop: 20 }}>
                                                <button onClick={playbackRateChangeVideo} value={1}>1x</button>
                                            </Grid>
                                            <Grid item style={{ paddingTop: 20 }}>
                                                <button onClick={playbackRateChangeVideo} value={1.5}>1.5x</button>
                                            </Grid>
                                            <Grid item style={{ paddingTop: 20 }}>
                                                <button onClick={playbackRateChangeVideo} value={2}>2x</button>
                                            </Grid>
                                        </Grid>
                                        <Grid container xs={2} justify={'flex-end'}>
                                            <Grid item>
                                                <p id="muteCheckbox">
                                                    Muted
                                                </p>
                                            </Grid>
                                        </Grid>
                                        <Grid item container xs={4}>
                                            <Checkbox
                                                checked={muted}
                                                color="primary"
                                                onChange={handleToggleMuted}
                                                style={{ marginLeft: 10, paddingLeft: 0, paddingTop: 5 }}
                                                justify={'flex-start'}
                                            />
                                        </Grid>


                                        <Grid container xs={2} justify={'flex-end'}>
                                            <Grid item>
                                                <p id="volume-slider">
                                                    Volume
                                                </p>
                                            </Grid>
                                        </Grid>
                                        <Grid item container xs={10}>
                                            <Slider value={volume}
                                                onChange={handleVolumeChange}
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                aria-labelledby="volume-slider"
                                                style={{ marginLeft: 15, paddingTop: 15 }}
                                            />
                                        </Grid>


                                        <Grid container xs={2} justify={'flex-end'}>
                                            <Grid item>
                                                <p id="seek-slider">
                                                    Seek
                                                </p>
                                            </Grid>
                                        </Grid>
                                        <Grid item container xs={10}>
                                            <Slider value={played}
                                                onChange={handleSeekChange}
                                                onChangeCommitted={handleSeekMouseUp}
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                aria-labelledby="seek-slider"
                                                style={{ marginLeft: 15, paddingTop: 15 }}
                                            />
                                        </Grid>


                                        <Grid container xs={2} justify={'flex-end'}>
                                            <Grid item>
                                                <p id="progress">
                                                    Loaded
                                                </p>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={10}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={(loaded * 100)}
                                                aria-labelledby="seek-slider"
                                                style={{ marginLeft: 15, marginTop: 15 }}
                                            />
                                        </Grid>
                                    </Grid>
                                </div>
                                :
                                ''
                            }
                        </div>

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
                                        <VideoChatComms peers={peers} peersRef={(peersRef.current)} />
                                }
                            </TabPanel>
                            <TabPanel value={currentTab} index={1}>
                                <UsersList key={usersInRoom.length} usersInRoom={usersInRoom} socketRef={socketRef} roomConfig={roomConfig} yourUser={yourUser} />
                            </TabPanel>

                        </div>
                    </Drawer>
                </div>
            }
        </>
    );
};

export default Room;
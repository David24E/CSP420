import React, { useEffect, useState, useRef } from "react";
import { Prompt } from "react-router-dom";
import io from "socket.io-client";
import PropTypes from 'prop-types';
import Peer from "simple-peer";
import { AppBar, Box, Button, Card, CardActions, CardContent, CardHeader, Checkbox, CssBaseline, Divider, Drawer, Grid, IconButton, LinearProgress, Popover, Slider, Snackbar, Tab, Tabs, TextField, Toolbar, Tooltip, Typography, Container } from "@material-ui/core";
import { Alert, AlertTitle } from '@material-ui/lab';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import FileCopyRoundedIcon from '@material-ui/icons/FileCopyRounded';
import FastRewindIcon from "@material-ui/icons/FastRewind";
import FastForwardIcon from "@material-ui/icons/FastForward";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import VolumeUp from "@material-ui/icons/VolumeUp";
import VolumeDown from "@material-ui/icons/VolumeDown";
import VolumeMute from "@material-ui/icons/VolumeOff";
import EjectIcon from '@material-ui/icons/Eject';
import PublishIcon from '@material-ui/icons/Publish';
import TextChatComms from "../components/userCommsSection/textChatComms/TextChatComms";
import VideoChatComms from "../components/userCommsSection/videoChatComms/VideoChatComms";
import UsersList from "../components/userCommsSection/usersList/UsersList";
import ReactPlayer from "react-player";
import moment from "moment";

const drawerWidth = '40%';
// const maxDrawerWidth = 425;

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
        height: '100vh',
        padding: theme.spacing(3),
        width: `calc(100% - ${drawerWidth})`,
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
    playerWrapper: {
        marginBottom: 10,
        background: 'rgba(0, 0, 0, .1)',
        width: 641,
        height: 360,
        position: "relative",
    },
    reactPlayerStyle: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    copySnackbar: {
        position: 'absolute',
        width: 360,
        top: theme.spacing(1.5),
        left: theme.spacing(1.5),
    },
    infoSnackbar: {
        position: 'absolute',
        bottom: theme.spacing(1.5),
        left: theme.spacing(1.5),
    },
    controlsWrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        zIndex: 1,
    },
    controlIcons: {
        color: "#777",
        fontSize: 50,
        transform: "scale(0.9)",
        "&:hover": {
            color: "#fff",
            transform: "scale(1)",
        },
    },
    bottomIcons: {
        color: "#999",
        "&:hover": {
            color: "#fff",
        },
    },
    volumeSlider: {
        width: 100,
    },
    mediaIconWithTextButton: {
        margin: theme.spacing(1),
    },
    loadEjectMediaWrapper: {
        width: '100%',
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

function ValueLabelComponent(props) {
    const { children, open, value } = props;

    return (
        <Tooltip open={open} enterTouchDelay={0} placement="top" title={value}>
            {children}
        </Tooltip>
    );
}

const PrettoSlider = withStyles({
    root: {
        height: 8,
    },
    thumb: {
        height: 16,
        width: 16,
        backgroundColor: "#fff",
        border: "2px solid currentColor",
        marginTop: -6,
        marginLeft: -8,
        "&:focus, &:hover, &$active": {
            boxShadow: "inherit",
        },
    },
    active: {},
    valueLabel: {
        left: "calc(-50% + 4px)",
    },
    track: {
        height: 4,
        borderRadius: 2,
    },
    rail: {
        height: 4,
        borderRadius: 2,
    },
})(Slider);

const format = (seconds) => {
    if (isNaN(seconds)) {
        return `00:00`;
    }
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh) {
        return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
};

let count = 0;

const Room = (props) => {
    const classes = useStyles();
    const [modalStyle] = useState(getModalStyle);

    const socketRef = useRef();
    const peersRef = useRef([]);
    const playerRef = useRef(null);
    const controlsRef = useRef(null);

    const roomID = props.match.params.roomID;
    const exitPromptText = 'Are you sure you want to leave this covideo session?';

    const [peers, setPeers] = useState([]);
    const [yourID, setYourID] = useState('');
    const [yourUser, setYourUser] = useState();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentTab, setCurrentTab] = useState(0);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [yourNickname, setYourNickname] = useState('');
    const [roomConfig, setRoomConfig] = useState({});
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
    const [timeDisplayFormat, setTimeDisplayFormat] = useState("normal");

    const [anchorEl, setAnchorEl] = useState(null);
    const [openCopySnackbar, setOpenCopySnackbar] = useState(false);
    const [infoSnackbar, setInfoSnackbar] = useState({ open: false, type: 'info', text: '', autoHideDuration: 0 });

    useEffect(() => {
        fetch(`api//room/${roomID}`)
            .then(response => response.json())
            .then(data => {
                console.log('data', data);
                setRoomConfig(data);
            });
    }, [])

    useEffect(() => {
        console.log('(roomConfig.roomComms === Video Chat)', (roomConfig.roomComms === 'Video Chat'));
        console.log('(roomConfig.roomComms === Text Chat)', (roomConfig.roomComms === 'Text Chat'));
        socketRef.current = io({ autoConnect: false });
        if ((roomConfig.roomComms === 'Text Chat')) {

            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(user => {
                    const peer = createPeer(user.id, socketRef.current.id, socketRef.current.nickname, null);
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
                const peer = addPeer(payload.signal, payload.callerID, null);
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

        } else if ((roomConfig.roomComms === 'Video Chat')) {

            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
                // socketRef.current = io.connect("/");

                socketRef.current.on("all users", users => {
                    const peers = [];
                    users.forEach(user => {
                        const peer = createPeer(user.id, socketRef.current.id, socketRef.current.nickname, null);
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
                    const peer = addPeer(payload.signal, payload.callerID, null);
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

            }).catch(err => {
                setOpenCopySnackbar(false);
                setInfoSnackbar({ open: true, type: 'info', text: 'Enable Video Chat by Allowing Camera and Microphone Access', autoHideDuration: 60000 });
                console.log(err.name + ": " + err.message);
            });

        }
        socketFunctionsAfterLoading();

    }, [roomConfig]);

    useEffect(() => {
        window.addEventListener('beforeunload', (event) => {
            // Cancel the event as stated by the standard.
            event.preventDefault();
            // Older browsers supported custom message
            event.returnValue = exitPromptText;
        });
    }, [])

    const socketFunctionsAfterLoading = () => {
        socketRef.current.on("receiving returned signal", payload => {
            const item = peersRef.current.find(p => p.peerID === payload.id);
            item.peer.signal(payload.signal);
        });

        socketRef.current.on("room full", () => {
            alert("room is full");
        })

        socketRef.current.on('your id', id => {
            console.log('your id');
            setYourID(id);
        })

        socketRef.current.on('all users in room', users => {
            console.log('all users in room');
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


            console.log('usersInRoom', users.length);
            console.dir(users);

            if (users.length > 1) {
                setOpenCopySnackbar(false);
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
    }

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
        console.log('createPeer', stream);
        let peer;
        if (stream) {
            peer = new Peer({
                initiator: true,
                trickle: false,
                stream,
            });
        } else {
            peer = new Peer({
                initiator: true,
                trickle: false,
            });
        }

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, callerNickname, roomID, signal })
        });

        peer.on("data", handleData);

        return peer;
    }

    const addPeer = (incomingSignal, callerID, stream) => {
        console.log('addPeer', stream);
        let peer;
        if (stream) {
            peer = new Peer({
                initiator: false,
                trickle: false,
                stream,
            });
        } else {
            peer = new Peer({
                initiator: false,
                trickle: false,
            });
        }

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID, roomID })
        });

        peer.on("data", handleData);

        peer.signal(incomingSignal);
        return peer;
    }

    const load = url => {
        console.log('url', url);
        setUrl(url);
        setPlayed(0);
        setLoaded(0);
        if (url) {
            setVideoID(url);
        } else {
            setVideoID('');
        }
    }

    const handlePlayPause = () => {
        setplaying(prevPlaying => !prevPlaying)
    }

    const handleRewind = () => {
        playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10);
    };

    const handleFastForward = () => {
        playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10);
    };

    const handleStart = () => {
        setplaying(true);
    }

    const handleStop = () => {
        setPlayed(0);
        setUrl(null);
        setplaying(false);
    }

    const handleVolumeSeekDown = (e, newValue) => {
        setSeeking(false);
        setVolume(parseFloat(newValue / 100));
    }

    const handleVolumeChange = (e, newValue) => {
        setVolume(parseFloat(newValue / 100));
        if (newValue === 0) {
            setMuted(true);
        } else {
            setMuted(false);
        }
    }

    const handleToggleMuted = () => {
        setMuted(prevMuted => !prevMuted);
    }

    const handleSetPlaybackRate = newValue => {
        setPlaybackRate(newValue);
    }

    const handlePlay = () => {
        setplaying(true);
    }

    const handlePause = () => {
        setplaying(false);
    }

    const handleSeekChange = (e, newValue) => {
        console.log('handleSeekChange setPlayed', newValue);
        setPlayed(parseFloat(newValue / 100));
    }

    const handleSeekMouseDown = (e) => {
        console.log('handleSeekMouseDown');
        setSeeking(true);
    };

    const handleSeekMouseUp = (e, newValue) => {
        console.log('handleSeekMouseUp', newValue);
        setSeeking(false);
        playerRef.current.seekTo((newValue / 100), 'fraction');
    }

    const handleMouseMove = () => {
        controlsRef.current.style.visibility = "visible";
        count = 0;
    }

    const hanldeMouseLeave = () => {
        controlsRef.current.style.visibility = "hidden";
        count = 0;
    }

    const handleChangeDisplayFormat = () => {
        if (timeDisplayFormat === 'normal') {
            setTimeDisplayFormat('remaining');
        } else {
            setTimeDisplayFormat('normal');
        }
    }

    const handleProgress = (state) => {
        /* if (count > 3) {
            controlsRef.current.style.visibility = "hidden";
            count = 0;
        }
        if (controlsRef.current.style.visibility === "visible") {
            count += 1;
        } */
        if (!seeking) {
            setPlayed(state.played);
            setLoaded(state.loaded);
        }
    };

    const handleEnded = () => {
        console.log('onEnded')
    }

    const handleDuration = (duration) => {
        console.log('onDuration', duration)
        setDuration(duration)
    }

    const currentTime = playerRef && playerRef.current
        ? playerRef.current.getCurrentTime()
        : "00:00";

    const formattedDuration = playerRef && playerRef.current
        ? playerRef.current.getDuration()
        : "00:00";
    const elapsedTime = timeDisplayFormat === "normal"
        ? format(currentTime)
        : `-${format(formattedDuration - currentTime)}`;

    const totalDuration = format(formattedDuration);


    const stopVideo = () => {
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "stop" }));
        }
        handleStop();
    }

    const playOrPauseVideo = () => {
        console.log('playOrPauseVideo');
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "playOrPause" }));
        }
        handlePlayPause();
    }

    const seekChangeVideo = (e, newValue) => {
        console.log('seekChangeVideo', newValue);
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "seekChange", data: newValue }));
        }
        handleSeekChange(null, newValue);
    }

    const fastForwardVideo = () => {
        console.log('fastForwardVideo');
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "fastForward" }));
        }
        handleFastForward();
    }

    const rewindVideo = () => {
        console.log('rewindVideo');
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "rewind" }));
        }
        handleRewind();
    }

    const playbackRateChangeVideo = (newValue) => {
        console.log('playbackRateChangeVideo', newValue);
        for (const peerRef of peersRef.current) {
            peerRef.peer.send(JSON.stringify({ type: "playbackRateChange", data: newValue }));
        }
        handleSetPlaybackRate(newValue);
    }

    const loadVideo = () => {
        console.log('ReactPlayer.canPlay(videoID)', ReactPlayer.canPlay(videoID));
        if (ReactPlayer.canPlay(videoID)) {
            for (const peerRef of peersRef.current) {
                console.log('peerRef', peerRef);
                console.log('peerRef connected', peerRef.peer.connected);
                console.log('peerRef destroyed', peerRef.peer.destroyed);
                peerRef.peer.send(JSON.stringify({ type: "newVideo", data: videoID }));
            }
            load(videoID);
        } else {
            setInfoSnackbar({ open: true, type: 'error', text: 'No playable content found at URL entered. Please try again', autoHideDuration: 6000 });
            for (const peerRef of peersRef.current) {
                console.log('peerRef', peerRef);
                console.log('peerRef connected', peerRef.peer.connected);
                console.log('peerRef destroyed', peerRef.peer.destroyed);
                peerRef.peer.send(JSON.stringify({ type: "newVideo", data: null }));
            }
            load(null);
        }
    }

    const handleReactPlayerError = (e) => {
        console.log('onError', e);
        setInfoSnackbar({ open: true, type: 'error', text: 'error', autoHideDuration: 3000 });
    }

    function handleData(data) {
        const parsed = JSON.parse(data);
        console.log('handleData', parsed.type, parsed.data);

        if (parsed.type === "newVideo") {
            load(parsed.data);
        } else if (parsed.type === "playOrPause") {
            handlePlayPause();
        } else if (parsed.type === "rewind") {
            handleRewind();
        } else if (parsed.type === "fastForward") {
            handleFastForward();
        } else if (parsed.type === "seekChange") {
            handleSeekMouseDown();
            handleSeekChange(null, parsed.data);
            handleSeekMouseUp(null, parsed.data);
        } else if (parsed.type === "playbackRateChange") {
            handleSetPlaybackRate(parsed.data);
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
                // setRoomConfig(hostRoom);
                setYourUser(yourUserState);
                setOpenCopySnackbar(true);
            } else {
                setNicknameFieldError(true);
            }
        });
    }

    const handleModalTextFieldChange = (e) => {
        const { value } = e.target;
        setYourNickname(value);
    }

    const handleCopyURL = () => {
        const url = window.location.href;

        navigator.clipboard.writeText(url).then(() => {
            console.log('Async: Copying to clipboard was successful!', url);
            setInfoSnackbar({ open: true, type: 'success', text: 'URL Copied To Clipboard!', autoHideDuration: 3000 });
        }, (err) => {
            console.error('Async: Could not copy text: ', err);
        });
    }

    const handlePopover = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };


    const handleCloseCopySnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenCopySnackbar(false);
    };

    const handleCloseInfoSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setInfoSnackbar({ open: false, type: 'info', text: '', autoHideDuration: 0 });
    };

    const leaveRoom = () => {
        socketRef.current.close();
        props.history.push(`/`);
    }

    const open = Boolean(anchorEl);
    const id = open ? "playbackrate-popover" : undefined;

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
                                label="Your Username"
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
                    <Prompt
                        when={true}
                        message={() => { return exitPromptText }}
                    ></Prompt>
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

                        <Container maxWidth='lg'>
                            <Grid container direction="row" alignItems="center" justify="center">
                                <div
                                    className={classes.playerWrapper}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={hanldeMouseLeave}
                                >
                                    <ReactPlayer
                                        config={{
                                            youtube: {
                                                playerVars: {
                                                    modestbranding: 1,
                                                    disablekb: 1,
                                                    showinfo: 1
                                                },
                                            },
                                        }}
                                        url={url}
                                        ref={playerRef}
                                        pip={false}
                                        playing={playing}
                                        controls={false}
                                        light={false}
                                        loop={false}
                                        playbackRate={playbackRate}
                                        volume={volume}
                                        muted={muted}
                                        onReady={() => console.log('onReady')}
                                        onStart={handleStart}
                                        onPlay={handlePlay}
                                        onPause={handlePause}
                                        onBuffer={() => console.log('onBuffer')}
                                        onSeek={handleSeekChange}
                                        onEnded={handleEnded}
                                        onError={e => handleReactPlayerError}
                                        onProgress={handleProgress}
                                        onDuration={handleDuration}
                                        progressInterval={100}
                                        className={classes.reactPlayerStyle}
                                        width='100%'
                                        height='100%'
                                    />

                                    <div ref={controlsRef}>
                                        {((roomConfig.roomType === 'Broadcast' && yourUser.hostUser) || roomConfig.roomType === 'Watch Together') ?
                                            <div className={classes.controlsWrapper}>
                                                {/* Top controls */}
                                                <Grid
                                                    container
                                                    direction="row"
                                                    alignItems="center"
                                                    justify="space-between"
                                                    style={{ padding: 16 }}
                                                >
                                                    <Grid item>
                                                        <Typography variant="h5" style={{ color: "#fff", opacity: 0 }}>
                                                            Video Title
                                                </Typography>
                                                    </Grid>
                                                </Grid>

                                                {/* middle controls */}

                                                <Grid container direction="row" alignItems="center" justify="center">
                                                    <IconButton onClick={rewindVideo} className={classes.controlIcons} aria-label="rewind">
                                                        <FastRewindIcon fontSize="inherit" />
                                                    </IconButton>

                                                    <IconButton onClick={playOrPauseVideo} className={classes.controlIcons} aria-label="play">
                                                        {playing ? (
                                                            <PauseIcon fontSize="inherit" />
                                                        ) : (
                                                                <PlayArrowIcon fontSize="inherit" />
                                                            )}
                                                    </IconButton>

                                                    <IconButton onClick={fastForwardVideo} className={classes.controlIcons} aria-label="forward">
                                                        <FastForwardIcon fontSize="inherit" />
                                                    </IconButton>
                                                </Grid>

                                                {/* bottom controls */}
                                                <Grid
                                                    container
                                                    direction="row"
                                                    justify="space-between"
                                                    alignItems="center"
                                                    style={{ padding: 12 }}
                                                >
                                                    <Grid item xs={12}>
                                                        <PrettoSlider
                                                            min={0}
                                                            max={100}
                                                            ValueLabelComponent={(props) => (
                                                                <ValueLabelComponent {...props} value={elapsedTime} />
                                                            )}
                                                            aria-label="seek-slider"
                                                            value={played * 100}
                                                            onChange={seekChangeVideo}
                                                            onMouseDown={handleSeekMouseUp}
                                                            onChangeCommitted={handleSeekMouseUp}
                                                        // onDuration={handleDuration}
                                                        />
                                                    </Grid>

                                                    <Grid item>
                                                        <Grid container alignItems="center" direction="row">
                                                            <IconButton onClick={playOrPauseVideo} className={classes.bottomIcons} style={{ padding: 4 }}>
                                                                {playing ? (
                                                                    <PauseIcon />
                                                                ) : (
                                                                        <PlayArrowIcon />
                                                                    )}
                                                            </IconButton>

                                                            <IconButton onClick={handleToggleMuted} className={classes.bottomIcons} style={{ padding: 4, marginRight: 4 }}>
                                                                {muted ? (
                                                                    <VolumeMute />
                                                                ) : volume > 0.5 ? (
                                                                    <VolumeUp />
                                                                ) : (
                                                                            <VolumeDown />
                                                                        )}
                                                            </IconButton>

                                                            <Slider
                                                                min={0}
                                                                max={100}
                                                                value={muted ? 0 : volume * 100}
                                                                onChange={handleVolumeChange}
                                                                aria-labelledby="input-slider"
                                                                className={classes.volumeSlider}
                                                                onMouseDown={handleSeekMouseDown}
                                                                onChangeCommitted={handleVolumeSeekDown}
                                                                style={{ padding: 4 }}
                                                            />

                                                            <Button
                                                                variant="text"
                                                                onClick={handleChangeDisplayFormat}
                                                                style={{ padding: 4 }}
                                                            >
                                                                <Typography
                                                                    variant="body1"
                                                                    style={{ color: "#fff", marginLeft: 16 }}
                                                                >
                                                                    {elapsedTime}/{totalDuration}
                                                                </Typography>
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid item>
                                                        <Button
                                                            onClick={handlePopover}
                                                            variant="text"
                                                            aria-describedby={id}
                                                            className={classes.bottomIcons}
                                                            style={{ padding: 4 }}
                                                        >
                                                            <Typography>{playbackRate}X</Typography>
                                                        </Button>
                                                        <Popover
                                                            // container={ref.current}
                                                            open={open}
                                                            id={id}
                                                            onClose={handleClose}
                                                            anchorEl={anchorEl}
                                                            anchorOrigin={{
                                                                vertical: "top",
                                                                horizontal: "left",
                                                            }}
                                                            transformOrigin={{
                                                                vertical: "bottom",
                                                                horizontal: "left",
                                                            }}
                                                        >
                                                            <Grid container direction="column-reverse">
                                                                {[0.5, 1, 1.5, 2].map((rate) => (
                                                                    <Button
                                                                        key={rate}
                                                                        onClick={() => playbackRateChangeVideo(rate)}
                                                                        variant="text"
                                                                    >
                                                                        <Typography
                                                                            color={rate === playbackRate ? "secondary" : "inherit"}
                                                                        >
                                                                            {rate}X
                                                                    </Typography>
                                                                    </Button>
                                                                ))}
                                                            </Grid>
                                                        </Popover>
                                                    </Grid>
                                                </Grid>
                                            </div>
                                            :
                                            ''
                                        }
                                    </div>
                                </div>

                                {(roomConfig.roomType === 'Broadcast' && yourUser.hostUser) || roomConfig.roomType === 'Watch Together' ?
                                    <div className={classes.loadEjectMediaWrapper}>
                                        <Grid container direction="row" alignItems="space-evenly" justify="space-evenly">
                                            <Grid item xs={2}>
                                                <Button
                                                    disableElevation
                                                    variant="outlined"
                                                    color="secondary"
                                                    className={classes.mediaIconWithTextButton}
                                                    startIcon={<EjectIcon />}
                                                    onClick={stopVideo}
                                                    disabled={url ? false : true}
                                                    style={{ marginRight: 4 }}
                                                >
                                                    Eject
                                                </Button>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <TextField
                                                    name="url"
                                                    value={videoID}
                                                    onChange={e => setVideoID(e.target.value)}
                                                    label="URL"
                                                    helperText="Enter Video URL"
                                                    autoComplete="off"
                                                    fullWidth
                                                    autoFocus
                                                    required
                                                />
                                            </Grid>
                                            <Grid item xs={2}>
                                                <Button
                                                    disableElevation
                                                    variant="outlined"
                                                    color="primary"
                                                    className={classes.mediaIconWithTextButton}
                                                    startIcon={<PublishIcon />}
                                                    onClick={loadVideo}
                                                >
                                                    Load
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </div>
                                    :
                                    ''
                                }
                            </Grid>
                        </Container>
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
                                    roomConfig.roomComms === 'Text Chat' ? <TextChatComms messages={messages} yourID={yourID} message={message} handleChange={handleChange} sendMessage={sendMessage} />
                                        : roomConfig.roomComms === 'Video Chat' ? <VideoChatComms peers={peers} peersRef={(peersRef.current)} />
                                            : leaveRoom()
                                }
                            </TabPanel>
                            <TabPanel value={currentTab} index={1}>
                                <UsersList key={usersInRoom.length} usersInRoom={usersInRoom} socketRef={socketRef} roomConfig={roomConfig} yourUser={yourUser} />
                            </TabPanel>

                        </div>
                    </Drawer>

                    <Snackbar
                        open={openCopySnackbar}
                        onClose={handleCloseCopySnackbar}
                        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                        className={classes.copySnackbar}
                    >
                        <Alert onClose={handleCloseCopySnackbar} severity="info">
                            <AlertTitle><strong>Joining Info</strong></AlertTitle>
                            <Typography variant={'body1'}>
                                Share this link with others you want in this room.
                            </Typography>
                            <br />
                            <br />
                            <Button
                                fullWidth
                                color="default"
                                disableElevation
                                variant="contained"
                                endIcon={<FileCopyRoundedIcon />}
                                onClick={handleCopyURL}
                            >
                                Click To Copy Invite URL
                            </Button>
                            <br />
                            <br />
                            <Typography variant={'caption'}>
                                Whenever necessary, the link can also be found in the people
                                tab on the right of the app. Or just copy and share the URL
                                from the address bar
                            </Typography>
                        </Alert>
                    </Snackbar>

                    <Snackbar
                        open={infoSnackbar.open}
                        onClose={handleCloseInfoSnackbar}
                        autoHideDuration={infoSnackbar.autoHideDuration}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        className={classes.infoSnackbar}
                    >
                        <Alert onClose={handleCloseInfoSnackbar} severity={infoSnackbar.type}>
                            {infoSnackbar.text}
                        </Alert>
                    </Snackbar>
                </div>
            }
        </>
    );
};

export default Room;
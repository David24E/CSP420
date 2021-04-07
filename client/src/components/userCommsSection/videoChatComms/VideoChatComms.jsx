import React, { useEffect, useRef } from "react";
import { makeStyles } from '@material-ui/core/styles';
/* 
import { Divider, IconButton } from "@material-ui/core";
import MicOffIcon from '@material-ui/icons/MicOff';
import MicIcon from '@material-ui/icons/Mic';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import VideocamIcon from '@material-ui/icons/Videocam';
 */

const useStyles = makeStyles({
    vidWrapper: {
        display: 'flex',
        flexWrap: 'wrap',
        marginLeft: -0,
        marginTop: -0,
    },
    vidContainer: {
        flex: '1 0 calc(50% - 0px)',
    },
    styledVideo: {
        width: '100%',
        height: '100%',
    },
    overlayContainer: {
        position: 'relative',
    },
    overlay: {
        left: 0,
        bottom: 8,
        zIndex: 1,
        opacity: 0.5,
        position: 'absolute',
        backgroundColor: 'black',
    },
    topText: {
        margin: 1,
        color: 'white',
        aligSelf: 'center',
    },
    /* 
    videoChatControlsContainer: {
        position: 'absolute',
        margin: '8px 0px',
        width: '93%',
        bottom: '0px',
        top: 'auto'
    },
    videoChatControls: {
        marginTop: '8px',
        width: '89%'
    },
     */
});

const Video = (props) => {
    const classes = useStyles();
    const ref = useRef();

    useEffect(() => {
        if (props.peer) {
            props.peer.on("stream", stream => {
                ref.current.srcObject = stream;
            })

            if (props.peer.streams) {
                ref.current.srcObject = props.peer.streams[0]
            }
        }
    }, []);

    return (
        <div className={classes.vidContainer}>
            <video className={classes.styledVideo} playsInline autoPlay muted ref={ref} />
            <div className={classes.overlayContainer}>
                <div className={classes.overlay}>
                    <p className={classes.topText}>{props.nickname}</p>
                </div>
            </div>
        </div>
    );
}


const VideoChatComms = (props) => {
    const classes = useStyles();
    const userVideoRef = useRef();

    /* 
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    */

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            if (userVideoRef.current) {
                userVideoRef.current.srcObject = stream;
            }
        })
    }, []);

    /* 
    const toggleAudio = () => {
        if (userVideoRef.current != null && userVideoRef.current.getAudioTracks().length > 0) {
            userVideoRef.current.getAudioTracks()[0].enabled = !isAudioOn;

            setIsAudioOn(prevMute => !prevMute);
        }
    }

    const toggleCam = () => {
        if (userVideoRef.current != null && userVideoRef.current.getVideoTracks().length > 0) {
            userVideoRef.current.getVideoTracks()[0].enabled = !isCamOn;

            setIsCamOn(prevCamOn => !prevCamOn);
        }
    }
    */

    return (
        <>
            <div className={classes.vidWrapper}>
                <div className={classes.vidContainer}>
                    <video className={classes.styledVideo} playsInline autoPlay muted ref={userVideoRef} />
                    <div className={classes.overlayContainer}>
                        <div className={classes.overlay}>
                            <p className={classes.topText}>You</p>
                        </div>
                    </div>
                </div>
                {props.peersRef.current.length > 0 ? props.peersRef.current.map((peersRef) => { return (<Video key={peersRef.peerID} peer={peersRef.peer} nickname={peersRef.peerNickname} />) }) : ''}
            </div>

            {/* <div className={classes.videoChatControlsContainer}>
                <Divider />
                <div id="videoChatControls" className={classes.videoChatControls}>
                    <IconButton id="muteBtn" color="primary" aria-label="toggle-video-chat-mute" onClick={toggleAudio}>
                        {isAudioOn ? <MicIcon /> : <MicOffIcon />}
                    </IconButton>
                    <IconButton id="camBtn" color="primary" aria-label="toggle-video-chat-cam" onClick={toggleCam}>
                        {isCamOn ? <VideocamIcon /> : <VideocamOffIcon />}
                    </IconButton>
                </div>
            </div> */}
        </>
    );
};

export default VideoChatComms;
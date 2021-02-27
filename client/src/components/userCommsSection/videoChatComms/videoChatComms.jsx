import React, { useEffect, useRef } from "react";
import { makeStyles } from '@material-ui/core/styles';

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
    }
});

const Video = (props) => {
    const classes = useStyles();
    const ref = useRef();

    useEffect(() => {
        if (props.peer) {
            props.peer.on("stream", stream => {
                ref.current.srcObject = stream;
            })
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

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            if (userVideoRef.current) {
                userVideoRef.current.srcObject = stream;
            }
        })
    }, []);

    return (
        <div className={classes.vidWrapper}>
            <div className={classes.vidContainer}>
                <video className={classes.styledVideo} playsInline autoPlay muted ref={userVideoRef} />
                <div className={classes.overlayContainer}>
                    <div className={classes.overlay}>
                        <p className={classes.topText}>You</p>
                    </div>
                </div>
            </div>
            {props.peersRef.length > 0 ? props.peersRef.map((peer) => { return (<Video key={peer.peerID} peer={peer.peer} nickname={peer.peerNickname} />)}) : ''}
        </div>
    );
};

export default VideoChatComms;
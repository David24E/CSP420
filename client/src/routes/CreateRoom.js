import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardActions, CardContent, Button, TextField, Divider, MenuItem, Snackbar, Typography, Fab } from "@material-ui/core";
import { Alert, AlertTitle } from '@material-ui/lab';
import InfoIcon from '@material-ui/icons/Info';
import { makeStyles, } from '@material-ui/core/styles';
import { v1 as uuid } from "uuid";
import ReactGA from "react-ga";
import moment from "moment";
import gaEvent from "../helper/googleAnalytics";

const useStyles = makeStyles((theme) => ({
    root: {
        minWidth: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },

    card: {
        minWidth: 275,
        maxWidth: 345,
    },

    fab: {
        position: 'absolute',
        top: theme.spacing(2),
        right: theme.spacing(2),
    },

    snackbar: {
        position: 'absolute',
        top: theme.spacing(1.5),
        right: theme.spacing(1.5),
    },

    infoIcon: {
        marginRight: theme.spacing(1),
    },

    maxWidth: {
        width: '100%',
    },

    textFieldVSpacing: {
        marginTop: 22,
    }
}));

const roomCommsConfigurations = ['Text Chat', 'Video Chat'];
const roomTypeConfigurations = ['Watch Together', 'Broadcast'];

const CreateRoom = (props) => {
    const classes = useStyles();

    const [roomName, setRoomName] = useState('');
    const [roomType, setRoomType] = useState(`${roomTypeConfigurations[0]}`)
    const [roomComms, setRoomComms] = useState(`${roomCommsConfigurations[0]}`)
    const [open, setOpen] = useState(false);

    useEffect(() => {
        ReactGA.pageview(window.location.pathname + window.location.search);
    })

    const handleMoreInfoButtonClick = () => {
        setOpen(true);
        gaEvent("ALERTS", "", `Clicked on more info button at ${moment().format('h:mm a')}`)
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    };

    const handleCreateRoomSubmission = (e) => {
        e.preventDefault();

        const roomID = uuid();
        const createRoomState = { roomID, roomName, roomType, roomComms };

        fetch('/', {
            method: "POST",
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify(createRoomState)
        })
            .then((result) => console.log(result.text()))
            .then(() => { props.history.push(`/room/${roomID}`) });

        gaEvent(`SESSIONS`, `${roomID}`, `Session Start at ${moment().format('h:mm a')}`);
        gaEvent('ROOMS', `${roomID}`, `Room Setup. Name: ${roomName}, Type: ${roomType}, Comms: ${roomComms}`);
    }

    const handleTextFieldChange = (e) => {
        const { value, name } = e.target;
        if (name === 'roomName') {
            setRoomName(value);
        } else if (name === 'roomComms') {
            setRoomComms(value);
        } else if (name === 'roomType') {
            setRoomType(value);
        }
    }

    return (
        <>
            <div className={classes.root}>
                <Fab
                    variant="extended"
                    size="small"
                    color="primary"
                    aria-label="add"
                    className={classes.fab}
                    onClick={handleMoreInfoButtonClick}
                >
                    <InfoIcon className={classes.infoIcon} />
                    More Info
                </Fab>

                <Card className={classes.card}>
                    <CardHeader title='CoVideo' />
                    <Divider />
                    <form noValidate autoComplete="off" onSubmit={handleCreateRoomSubmission} >
                        <CardContent>
                            <TextField name="roomName" fullWidth value={roomName} className={classes.textFieldVSpacing} onChange={handleTextFieldChange} label="Room Name" helperText="Name the Room" autoFocus required />
                            <TextField name="roomComms" select fullWidth value={roomComms} className={classes.textFieldVSpacing} onChange={handleTextFieldChange} label="Room Comms" helperText="Choose the Preferred Communication Mode">
                                {roomCommsConfigurations.map(roomComms => (
                                    <MenuItem key={roomComms} value={roomComms}>{roomComms}</MenuItem>
                                ))}
                            </TextField>
                            <TextField name="roomType" select fullWidth value={roomType} className={classes.textFieldVSpacing} onChange={handleTextFieldChange} label="Room Type" helperText="Choose the Required Room Configuration">
                                {roomTypeConfigurations.map(roomType => (
                                    <MenuItem key={roomType} value={roomType}>{roomType}</MenuItem>
                                ))}
                            </TextField>
                        </CardContent>
                        <CardActions>
                            <Button variant="contained" color="primary" className={classes.maxWidth} type="submit" disabled={!roomName}>Create room</Button>
                        </CardActions>
                    </form>
                </Card>

                {/* <Alert severity="info">
                    <AlertTitle>Info</AlertTitle>
                    This is an info alert — <strong>check it out!</strong>
                </Alert> */}

                <Snackbar
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    className={classes.snackbar}
                >
                    <Alert onClose={handleClose} severity="info">
                        <AlertTitle>More Info</AlertTitle>
                        <Typography>
                            <strong>Room Name: </strong>Name the room you are creating.
                        </Typography>
                        <Typography>
                            <strong>Room Comms: </strong>Select <em>Text Chat</em> for instant<br />
                            messaging or <em>Video Chat</em> for audio/video <br />
                            communication.
                        </Typography>
                        <Typography>
                            <strong>Room Type: </strong>Select <em>Watch Together</em> for shared<br />
                            access to video player controls amongst all<br />
                            particpants or <em>Broadcast</em> for restricted access.<br />
                            In Broadcast mode, the host can grant other <br />
                            users access to controls on-demand.
                        </Typography>
                    </Alert>
                </Snackbar>
            </div>

        </>
    );
};

export default CreateRoom;
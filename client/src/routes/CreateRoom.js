import React, { useState } from "react";
import { Card, CardHeader, CardActions, CardContent, Button, TextField, Divider, MenuItem } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import { v1 as uuid } from "uuid";

const useStyles = makeStyles({
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

    maxWidth: {
        width: '100%',
    },

    textFieldVSpacing: {
        marginTop: 22,
    }
});

const roomCommsConfigurations = ['Text Chat', 'Video Chat'];
const roomTypeConfigurations = ['Watch Together', 'Broadcast'];

const CreateRoom = (props) => {
    const classes = useStyles();

    const [roomName, setRoomName] = useState('');
    const [roomType, setRoomType] = useState(`${roomTypeConfigurations[0]}`)
    const [roomComms, setRoomComms] = useState(`${roomCommsConfigurations[0]}`)

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
        .then(() => {props.history.push(`/room/${roomID}`)});
    }

    const handleTextFieldChange = (e) => {
        const { value, name } = e.target;
        if (name === 'roomName') {
            console.log('value' + value)
            setRoomName(value);
        } else if (name === 'roomComms') {
            console.log('value and name ' + value + ' ' + name);
            setRoomComms(value);
        } else if (name === 'roomType') {
            console.log('value and name ' + value + ' ' + name);
            setRoomType(value);
        }
    }

    return (
        <>
            <div className={classes.root}>
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
            </div>

        </>
    );
};

export default CreateRoom;
import React, { useState } from "react";
import { Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Snackbar, Typography } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import FileCopyRoundedIcon from '@material-ui/icons/FileCopyRounded';
import Popover from '@material-ui/core/Popover';
import gaEvent from "../../../helper/googleAnalytics";

const useStyles = makeStyles((theme) => ({
    confirmCopySnackbar: {
        position: 'fixed',
        left: theme.spacing(1.5),
        height: 20,
    },
    listTop: {
        paddingTop: 0
    }
}));

const UsersList = (props) => {
    const classes = useStyles();
    const [openConfirmCopySnackbar, setOpenConfirmCopySnackbar] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleCopyURL = () => {
        const url = window.location.href;

        navigator.clipboard.writeText(url).then(() => {
            console.log('Async: Copying to clipboard was successful!', url);
            setOpenConfirmCopySnackbar(true);
            gaEvent('ALERTS', `${props.roomID}`, `URL copy Success`);
        }, (err) => {
            console.error('Async: Could not copy text: ', err);
            gaEvent('ALERTS', `${props.roomID}`, `URL copy Error`);
        });
    }


    const handleCloseConfirmCopySnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenConfirmCopySnackbar(false);
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMakingUserHost = (user) => {
        props.socketRef.current.emit('set user as host', user);
        gaEvent('ROOMS', `${props.roomID}`, `User ${props.yourUser.nickname} makes new host –– ${user.nickname}`);
    }

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    return (
        <>
            <Snackbar
                open={openConfirmCopySnackbar}
                onClose={handleCloseConfirmCopySnackbar}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                className={classes.confirmCopySnackbar}
            >
                <Alert onClose={handleCloseConfirmCopySnackbar} severity="success">
                    URL Copied To Clipboard!
                </Alert>
            </Snackbar>

            <div>
                <Typography>
                    <strong>Room Name:</strong> {props.roomName}
                </Typography>
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
            </div>

            <Typography>
                <br />
                <br />
                <strong>People currently in the room:</strong>
            </Typography>
            <List className={classes.listTop}>
                {props.usersInRoom.map((users) => (
                    <ListItem key={users.id}>
                        <ListItemText primary={users.nickname} />
                        {(props.roomConfig.roomType === 'Broadcast' && props.yourUser.hostUser && !users.hostUser) ?
                            <ListItemSecondaryAction>
                                <IconButton edge="end" aria-label="delete" onClick={handleClick}>
                                    <MoreVertIcon />
                                </IconButton>
                                <Popover
                                    id={id}
                                    open={open}
                                    anchorEl={anchorEl}
                                    onClose={handleClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'center',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'center',
                                    }}
                                >
                                    <Button
                                        color="default"
                                        disableElevation
                                        variant="contained"
                                        onClick={() => handleMakingUserHost(users)}
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        make participant co-host
                                    </Button>
                                </Popover>
                            </ListItemSecondaryAction>
                            : ''}
                    </ListItem>
                ))}
            </List>
        </>
    );
};

export default UsersList;
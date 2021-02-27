import React, { useEffect, useState } from "react";
import { Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography } from "@material-ui/core";
import CheckRoundedIcon from '@material-ui/icons/CheckRounded';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import FileCopyRoundedIcon from '@material-ui/icons/FileCopyRounded';
import Popover from '@material-ui/core/Popover';

const UsersList = (props) => {
    const [text, setText] = useState('Click To Copy Invite URL');
    const [buttonIcon, setButtonIcon] = useState(<FileCopyRoundedIcon />);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleCopyURL = () => {
        const url = window.location.href;

        navigator.clipboard.writeText(url).then(() => {
            console.log('Async: Copying to clipboard was successful!', url);

            setText('URL Copied To Clipboard!');
            setButtonIcon(<CheckRoundedIcon />);
        }, (err) => {
            console.error('Async: Could not copy text: ', err);
        });
    }
    
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };
    
    const handleMakingUserHost = (user) => {
        props.socketRef.current.emit('set user as host', user);
    }

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    return (
        <>
            <div>
                <Button
                    fullWidth
                    color="default"
                    disableElevation
                    variant="contained"
                    endIcon={buttonIcon}
                    onClick={handleCopyURL}
                >
                    {text}
                </Button>
            </div>

            <List>
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
                                        style={{textTransform: 'capitalize'}}
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
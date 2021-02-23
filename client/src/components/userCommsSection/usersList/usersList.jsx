import React, { useEffect } from "react";
import { Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from "@material-ui/core";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import GroupAdd from '@material-ui/icons/GroupAdd';

const UsersList = (props) => {

    useEffect(() => {
        // props.usersInRoom.map((users) => {
            console.log('userinroom ', props.usersInRoom);
            console.dir(props.usersInRoom);
        // }
    }, []);

    return (
        <>
            <div>
                <Button
                    variant="contained"
                    color="default"
                    startIcon={<GroupAdd />}
                    disableElevation
                    fullWidth
                >
                    Add People
                </Button>
            </div>

            <List>
                {props.usersInRoom.map((users) => (
                    <ListItem key={users.id}>
                        <ListItemText primary={users.nickname}/>
                        {/* <ListItemIcon>{<MoreVertIcon />}</ListItemIcon> */}
                        <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete">
                                <MoreVertIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
        </>
    );
};

export default UsersList;
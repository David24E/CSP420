import React from "react";
import { Grid, ListItemText, Typography } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
    message: {
        backgroundColor: '#aab6fe',
        margin: '4px 0px',
        padding: '0px 5px',
        borderRadius: '5px',
        width: '100%'
    },
    myMessage: {
        backgroundColor: '#d1d9ff',
        margin: '4px 0px',
        padding: '0px 5px',
        borderRadius: '5px',
        width: '100%'
    }
});

const Message = (props) => {
    const classes = useStyles();
    let messageStyle = {};

    if (props.messageType === 'mine') {
        messageStyle.class = classes.message;
        messageStyle.align = 'right';
    } else if (props.messageType === 'otherUser') {
        messageStyle.class = classes.myMessage;
        messageStyle.align = 'left';
    }

    return (
        <>
            <div className={messageStyle.class}>
                <Grid container>
                    <Grid item xs={12}>
                        <ListItemText align={messageStyle.align} secondary={
                            <React.Fragment>
                                <Typography
                                    component="span"
                                    variant="body2"
                                    color="primary"
                                >
                                    {props.messageUser}
                                </Typography>
                                {` | ${props.messageTime}`}
                            </React.Fragment>
                        }></ListItemText>
                    </Grid>
                    <Grid item xs={12}>
                        <ListItemText align={messageStyle.align}>{props.children}</ListItemText>
                    </Grid>
                </Grid>
            </div>
        </>
    );
};

export default Message;
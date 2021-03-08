import React, { useEffect, useRef } from "react";
import { List, ListItem, IconButton, Divider, TextField } from "@material-ui/core";
import SendIcon from '@material-ui/icons/Send';
import { makeStyles } from '@material-ui/core/styles';
import Message from "./Message";

const useStyles = makeStyles({
    chatFormContainer: {
        position: 'absolute',
        margin: '8px 0px',
        width: 'calc(100% - 32px)',
        bottom: '0px',
        top: 'auto'
    },
    chatForm: {
        marginTop: '8px',
    },
    textField: {
        width: 'calc(100% - 48px)'
    },
    messageArea: {
        height: '70vh',
        overflowY: 'auto'
    },
    message: {
        padding: '0px',
        margin: '0px'
    },
});

const TextChatComms = (props) => {
    const classes = useStyles();
    const messageArea = useRef(null);

    useEffect(() => {
        if (messageArea) {
            messageArea.current.addEventListener('DOMNodeInserted', event => {
                const { currentTarget: target } = event;
                target.scroll({ top: target.scrollHeight, behavior: 'smooth' });
            });
        }
    }, []);

    return (
        <>
            <List className={classes.messageArea} ref={messageArea}>
                {props.messages.map((message, index) => {
                    if (message.id === props.yourID) {
                        return (
                            <ListItem key={index} className={classes.message}>
                                <Message messageType='mine' messageUser={message.nickname} messageTime={message.time}>
                                    {message.body}
                                </Message>
                            </ListItem>
                        )
                    }
                    return (
                        <ListItem key={index} className={classes.message}>
                            <Message messageType='otherUser' messageUser={message.nickname} messageTime={message.time}>
                                {message.body}
                            </Message>
                        </ListItem>
                    )
                })}
            </List>

            <div className={classes.chatFormContainer}>
                <Divider />
                <form id="chat-form" className={classes.chatForm} onSubmit={props.sendMessage} noValidate autoComplete="off">
                    <TextField id="msg" placeholder="Enter Message" className={classes.textField} value={props.message} onChange={props.handleChange} required />
                    <IconButton id="iconBtn" type='submit' color="primary" aria-label="send Message" disabled={!props.message}>
                        <SendIcon />
                    </IconButton>
                </form>
            </div>
        </>
    );
};

export default TextChatComms;
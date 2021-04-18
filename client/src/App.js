import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import CreateRoom from './routes/CreateRoom';
import Room from "./routes/Room";
import './App.css';
import ReactGA from "react-ga";
import moment from "moment";

const useStyles = makeStyles({
  appRoot: {
    display: 'flex',
    justifyContent: 'center',
    minHeight: '100vh',
    flexDirection: 'column',
    alignItems: 'center',
  },
});

function App() {
  const classes = useStyles();
  if (process.env.NODE_ENV === 'production') {
    ReactGA.initialize('UA-192856708-2');
    window['ga-disable-UA-192856708-2'] = true;
  } else {
    ReactGA.initialize('UA-192856708-1');
    window['ga-disable-UA-192856708-1'] = true;
  }

  return (
    <div className={classes.appRoot}>
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={CreateRoom} />
          <Route path="/room/:roomID" component={Room} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;

import React, { useEffect } from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import CreateRoom from './routes/CreateRoom';
import Room from "./routes/Room";
import './App.css';
import ReactGA from "react-ga";

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

  useEffect(() => {
    ReactGA.initialize('G-W3D253QY1B');
    // ReactGA.pageview(window.location.pathname + window.location.search);
  })

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

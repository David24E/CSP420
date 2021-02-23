import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import CreateRoom from './routes/CreateRoom';
import Room from "./routes/Room";
import './App.css';

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

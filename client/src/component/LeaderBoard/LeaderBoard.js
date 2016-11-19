import React from 'react';
import { browserHistory } from 'react-router';
import LeaderBoardDataScore from './LeaderBoardDataScore.js';
import LeaderBoardDataUser from './LeaderBoardDataUser.js';

class LeaderBoard extends React.Component {
  constructor(props) {
	  super(props);
	  this.state = {
	    user: null,
      leaderBoards: []
	  };
	  this.backToHome = this.backToHome.bind(this);
  }

  backToHome() {
    browserHistory.push('/Home');
  }

  componentWillMount() {
    $.ajax({
      url: '/api/leaderBoard',
      method: 'GET',
      success: (data) => {
        this.setState({leaderBoards: data.reverse()})
      }
    })
  }

  render() {
    return (
      <div id='LeaderBoardTitle'>
        <div id='LeaderData'>
          <div id='CreateMatchBackground'>
          <h1 id='LeaderBoardTitle2'>Smash Ball Brawl Leaderboard</h1>
          <button id='HOMEButton' className='btn btn-primary' onClick={this.backToHome}>HOME</button>
          <div id='DataLeader'>
            <div id='LeaderBoardUser'>
              <div id="LeaderBoardUserNameTitle">USERNAME</div>
              {this.state.leaderBoards.map(leader => <LeaderBoardDataUser leader={leader} />)}
            </div>
            <div id='LeaderBoardScore'>
              <div id="LeaderBoardScoreTitle">SCORE</div>
              {this.state.leaderBoards.map(leader => <LeaderBoardDataScore leader={leader} />)}
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  	
  }
}



export default LeaderBoard;

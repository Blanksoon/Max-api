import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import registerServiceWorker from './registerServiceWorker';

class App extends React.Component {

    /// parent method

    constructor() {
        super()

    }

    getInitialStage() {

    }

    componentWillMount() {

    }

    componentDidMount() {

    }

    render () {
        return (
            <div>
                <div>
                    <button onClick={this.getData}>getData</button>
                </div>
                <div>
                    <button onClick={this.postData}>postData</button>
                </div>
                <div>
                    <button onClick={this.putData}>putData</button>
                </div>
                <div>
                    <button onClick={this.deleteData}>deleteData</button>
                </div>
            </div>
        )
    }

    /// end parent method

    /// class method

    getData() {
        fetch('http://localhost:8898/contents',{
            method : "GET"
        })
        .then(function(response) {
            return ( response.json() );
        })
        .then(function(data) {
            console.log ( data );
        });

    }

    getData() {
        fetch('http://localhost:8898/contents',{
            method : "GET"
        })
        .then(function(response) {
            return ( response.json() );
        })
        .then(function(data) {
            console.log ( data );
        });
    }

    postData() {
        fetch('http://localhost:8898/contents',{
            method : "POST"
        })
        .then(function(response) {
            return ( response.json() );
        })
        .then(function(data) {
            console.log ( data );
        });
    }

    putData() {
        fetch('http://localhost:8898/contents',{
            method : "PUT"
        })
        .then(function(response) {
            return ( response.json() );
        })
        .then(function(data) {
            console.log ( data );
        });
    }

    deleteData() {
        fetch('http://localhost:8898/contents',{
            method : "DELETE"
        })
        .then(function(response) {
            return ( response.json() );
        })
        .then(function(data) {
            console.log ( data );
        });

    }

    /// end class method
}

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();

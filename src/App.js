import { useState, useEffect } from 'react';
import Calendar from './Calendar.js';
import Login from './Login.js';
import CreateAccount from './CreateAccount.js'
import Payments from './Payments.js'
import HomePage from './HomePage'
import './App.css';

function setToken(userToken) {
  sessionStorage.setItem('token', JSON.stringify(userToken));
}

function getToken() {
  const tokenString = sessionStorage.getItem('token')
  const userToken = JSON.parse(tokenString)
  return userToken
}

function App() {
  const user = getToken()
  const [view, setView] = useState('home');
  const [bookedSessions, setBookedSessions] = useState([]);
  const [availability, setAvailability] = useState([])
  const [specialAvailability, setSpecialAvailability] = useState([])
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/users/')
    .then(res => res.json())
    .then(result => setUsers(result))
  }, [])

  useEffect(() => {
    fetch('http://localhost:5000/sessions/')
    .then(res => res.json())
    .then(result => {setBookedSessions(result)})
  }, [])

  useEffect(() => {
    fetch('http://localhost:5000/availability/')
    .then(res => res.json())
    .then(result => {setAvailability(result)})
  }, [])

  useEffect(() => {
    fetch('http://localhost:5000/specialAvailability/')
    .then(res => res.json())
    .then(result => {setSpecialAvailability(result)})
  }, [])

  return (
    <div className="App">
      <header className="appHeader">
       <button className='homeButton' onClick={() => setView('home')}>Pam's Tutoring</button>
        {user !== null ? 
        <div className="tabContainer">
          <button 
            className={view === 'schedule' ? "tab tabSelected" : "tab"} 
            onClick={() => setView('schedule')}>
              My Schedule
          </button>
          <button 
            className={view === 'payments' ? "tab tabSelected" : "tab"} 
            onClick={() => setView('payments')}>
              Payments
          </button>
          <button 
            className="tab" 
            onClick={() => {
              sessionStorage.clear() 
              getToken()
              setView('logout')
              }}>
              Log out
          </button>
        </div>
        :
        <div className="tabContainer">
          <button 
            className={view === 'login' ? "tab tabSelected" : "tab"} 
            onClick={() => setView('login')}>
              Log in
          </button>
          <button 
            className={view === 'signup' ? "tab tabSelected" : "tab"} 
            onClick={() => setView('createAccount')}>
              Create account
          </button>
        </div>}
      </header>

      <div className='calendarContainer'>
        {view === 'schedule' && <Calendar 
          bookedSessions={bookedSessions} 
          setBookedSessions={setBookedSessions}
          availability={availability} 
          setAvailability={setAvailability}
          specialAvailability={specialAvailability}
          setSpecialAvailability={setSpecialAvailability}
          user={user} 
          users={users}/>}
        {view === 'payments' && <Payments bookedSessions={bookedSessions} setBookedSessions={setBookedSessions} user={user} users={users} setUsers={setUsers}/>}
        {view === 'home' && user &&  <p> Hi, {user.name}!  Use the buttons above to navigate to your schedule and payments.</p>}
        {view === 'home' && !user && <HomePage/>}
        {view === 'login' && <Login 
          users={users} 
          setToken={setToken} 
          setView={setView} />}
        {view === 'createAccount' && <CreateAccount users={users} setUsers={setUsers}/>}
        {view === 'logout' && <p> Goodbye! </p>}
      </div>
    </div>
  );
}

export default App;

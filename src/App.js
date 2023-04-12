import { useState, useEffect } from 'react';
import Calendar from './Calendar.js';
import Login from './Login.js';
import CreateAccount from './CreateAccount.js'
import Payments from './Payments.js'
import './App.css';

function setToken(userToken) {
  sessionStorage.setItem('token', JSON.stringify(userToken));
}

function getToken() {
  const tokenString = sessionStorage.getItem('token')
  const userToken = JSON.parse(tokenString)
  return userToken
}

const HomePage = () => {
  return (
    <div>
    <div className="homePageHeader">
      <img  src={require('./pam.jpg')} alt="Image of Pam"/>
      <h1>Hi, I'm Pam!</h1>
    </div>
    <p>
      For over 20 years, I have been nourishing the minds of today and tomorrow to find success and a love of learning.
      I am a passionate teacher and tutor, covering subjects including math, science, and German.  I teach students of
      all ages and abilities, from young childhood to college.  If you already work with me, please log in to see your schedule and book appointments.
      Otherwise, feel free to get in touch to talk more about how we can work together, or sign up to create an account!
    </p>
    </div>
  )
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
      <header className="App-header">
       <button className='Home-button' onClick={() => setView('home')}>Pam's Tutoring</button>
        {user !== null ? 
        <div className="Tab-container">
          <button 
            className={view === 'schedule' ? "Tab Tab-selected" : "Tab"} 
            onClick={() => setView('schedule')}>
              My Schedule
          </button>
          <button 
            className={view === 'payments' ? "Tab Tab-selected" : "Tab"} 
            onClick={() => setView('payments')}>
              Payments
          </button>
          <button 
            className="Tab" 
            onClick={() => {
              sessionStorage.clear() 
              getToken()
              setView('logout')
              }}>
              Log out
          </button>
        </div>
        :
        <div className="Tab-container">
          <button 
            className={view === 'login' ? "Tab Tab-selected" : "Tab"} 
            onClick={() => setView('login')}>
              Log in
          </button>
          <button 
            className={view === 'signup' ? "Tab Tab-selected" : "Tab"} 
            onClick={() => setView('createAccount')}>
              Create account
          </button>
        </div>}
      </header>

      <div className='Calendar-container'>
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

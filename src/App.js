import { useState, useEffect } from 'react';
import Calendar from './Calendar.js';
import Login from './Login.js';
import CreateAccount from './CreateAccount.js'
import Payments from './Payments.js'
import HomePage from './HomePage'
import './App.css';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, onSnapshot, getDoc, doc } from "firebase/firestore";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAR4G4EA_BWurG7udTKWEyCU_g_N2_E3vE",
  authDomain: "pam-tutoring.firebaseapp.com",
  databaseURL: "https://pam-tutoring.firebaseio.com",
  projectId: "pam-tutoring",
  storageBucket: "pam-tutoring.appspot.com",
  messagingSenderId: "476525246267",
  appId: "1:476525246267:web:023ca3ce9b77a43c0ea91e",
  measurementId: "G-QG4QS48NTY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const db = getFirestore(app)

function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('home');
  const [bookedSessions, setBookedSessions] = useState([]);
  const [availability, setAvailability] = useState([])
  const [specialAvailability, setSpecialAvailability] = useState([])
  const [users, setUsers] = useState([]);

  useEffect(() => { 
    onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data()))
    })

    onSnapshot(collection(db, 'sessions'), (snapshot) => {
      setBookedSessions(snapshot.docs.map(doc => doc.data()))
    })

    onSnapshot(collection(db, 'availability'), (snapshot) => {
      setAvailability(snapshot.docs.map(doc => doc.data()))
    })

    onSnapshot(collection(db, 'specialAvailability'), (snapshot) => {
      setSpecialAvailability(snapshot.docs.map(doc => doc.data()))
    })
  }, [])

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user === null) {
        setUser(null)
      } else {
        getDoc(doc(db, 'users', user.uid)).then((document) => setUser(document.data() ?? null))
      }
    })
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
              signOut(auth)
              .then(() => {setView('home')})
              .catch((error) => {console.error(error)})}}>
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
          users={users}
          db={db}/>}
        {view === 'payments' && <Payments bookedSessions={bookedSessions} setBookedSessions={setBookedSessions} user={user} users={users} setUsers={setUsers}/>}
        {view === 'home' && user &&  <p> Hi, {user.name}!  Use the buttons above to navigate to your schedule and payments.</p>}
        {view === 'home' && !user && <HomePage/>}
        {view === 'login' && <Login auth={auth} setView={setView} />}
        {view === 'createAccount' && <CreateAccount auth={auth} users={users} setUsers={setUsers} setView={setView} db={db}/>}
      </div>
    </div>
  );
}

export default App;

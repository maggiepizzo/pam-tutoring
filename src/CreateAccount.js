import { useState } from 'react';
import PasswordField from './PasswordField.js';
import './App.css';

const CreateAccount = ({users, setUsers}) => {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email1, setEmail1] = useState("");
    const [email2, setEmail2] = useState("");
    const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");
    const [feedback, setFeedback] = useState();
    
    var bcrypt = require('bcryptjs');
    const saltRounds = 10;

    const handleCreateAccount = async e => {
        e.preventDefault()
        if (!firstName || !lastName || !email1 || !email2 || !password1 || !password2) {
            setFeedback("Fill in all required fields.")
        } else if (email1 !== email2) {
            setFeedback("Email addresses don't match.")
        } else if (users.find(user => user.email === email1)) {
            setFeedback("An account with this email address already exists.  Try logging in.")
        } else if (password1 !== password2) {
            setFeedback("Passwords don't match.")
        } else {
            setFeedback("Creating new account...")
            bcrypt.hash(password1, saltRounds).then(function(hash) {
                const user = {
                "id": email1,
                "email": email1,
                "password": hash,
                "admin": false,
                "name": firstName + " " + lastName,
                "rate": 100
                }
                fetch('http://localhost:5000/users', {
                    method: 'POST',
                    headers: {
                    'Content-type': 'application/json',
                    },
                    body: JSON.stringify(user),
                })
                .then(setUsers(users.concat([user])))
                .then(setFeedback("Successfully created account!  Navigate to the Login tab to log in."))
            })
        }
    }

    return (
      <form className='loginContainer' onSubmit={handleCreateAccount}>
          <h1>Create an account.</h1>
          <input
              type="text"
              className='loginField'
              placeholder='First Name'
              onChange={(e) => setFirstName(e.target.value)}
          />
          <input
              type="text"
              className='loginField'
              placeholder='Last Name'
              onChange={(e) => setLastName(e.target.value)}
          />
          <input
              type="text"
              className='loginField'
              placeholder='Email'
              onChange={(e) => setEmail1(e.target.value)}
          />
          <input
              type="text"
              className='loginField'
              placeholder='Re-enter email'
              onChange={(e) => setEmail2(e.target.value)}
          />
          <PasswordField placeholder={"Password"} onChange={(e) => setPassword1(e.target.value)} />
          <PasswordField placeholder={'Re-enter password'} onChange={(e) => setPassword2(e.target.value)}/>
          <button className="loginButton">Create Account</button>
          <div>
                {feedback && feedback}
            </div>
      </form>
    )
  }


  export default CreateAccount;
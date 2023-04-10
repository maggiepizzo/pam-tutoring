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
            const user = {
                "id": email1,
                "email": email1,
                "password": password1,
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
        }
    }

    return (
      <form className='Login-container' onSubmit={handleCreateAccount}>
          <h1>Create an account.</h1>
          <input
              type="text"
              className='Login-field'
              placeholder='First Name'
              onChange={(e) => setFirstName(e.target.value)}
          />
          <input
              type="text"
              className='Login-field'
              placeholder='Last Name'
              onChange={(e) => setLastName(e.target.value)}
          />
          <input
              type="text"
              className='Login-field'
              placeholder='Email'
              onChange={(e) => setEmail1(e.target.value)}
          />
          <input
              type="text"
              className='Login-field'
              placeholder='Re-enter email'
              onChange={(e) => setEmail2(e.target.value)}
          />
          <PasswordField placeholder={"Password"} onChange={(e) => setPassword1(e.target.value)} />
          <PasswordField placeholder={'Re-enter password'} onChange={(e) => setPassword2(e.target.value)}/>
          <button className="Login-button">Create Account</button>
          <div>
                {feedback && feedback}
            </div>
      </form>
    )
  }

  export default CreateAccount;
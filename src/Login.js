import { useState } from 'react';
import PasswordField from './PasswordField.js';
import './App.css';

const Login = ({users, setToken, setView}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [feedback, setFeedback] = useState();
    var bcrypt = require('bcryptjs');

    const handleLogin = async e => {
        e.preventDefault()
        const user = users.find(user => user.email === email)
        if (!user) {
            setFeedback("No account assosciated with this email address.  First time here?  Create an account.")
        } else {
            bcrypt.compare(password, user.password).then(function(result) {
                if (result == true) {
                    setFeedback("Logging you in...")
                    setToken(user)
                    setView('home')
                } else {
                    setFeedback("Incorrect password.")
                }
            });      
        }
    }

    return(
        <form className='Login-container' onSubmit={handleLogin}>
            <h1>Welcome to Pam's Tutoring.</h1>
            <h2>Log in to continue.</h2>
            <input
                type="text"
                className='Login-field'
                placeholder='Email'
                onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordField placeholder={"Password"} onChange={e => setPassword(e.target.value)}/>
            <button className="Login-button">Log in</button>
            <div>
                {feedback && feedback}
            </div>
        </form>
    )
}

export default Login;

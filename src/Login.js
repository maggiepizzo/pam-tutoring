import { useState } from 'react';
import PasswordField from './PasswordField.js';
import './App.css';

const Login = ({users, setToken, setView}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [feedback, setFeedback] = useState();

    const handleLogin = async e => {
        console.log(users)
        e.preventDefault()
        const matches = users.find(user => user.email === email && user.password === password)
        if (!matches) {
            setFeedback("Incorrect email or password")
        } else {
            setFeedback("Logging you in...")
            setToken(matches)
            setView('home')
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

import { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import PasswordField from './PasswordField.js';
import './App.css';

const Login = ({ auth, setView}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [feedback, setFeedback] = useState();

    const handleLogin = async e => {
        e.preventDefault()
        signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            setFeedback("Logging you in...")
            setView('home')
        })
        .catch((error) => {
            console.error(error)
            setFeedback("Username or password is incorrect.")
        });
    }

    return(
        <form className='loginContainer' onSubmit={(e) => handleLogin(e)}>
            <h1>Welcome to Pam's Tutoring.</h1>
            <h2>Log in to continue.</h2>
            <input
                type="text"
                className='loginField'
                placeholder='Email'
                onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordField placeholder={"Password"} onChange={e => setPassword(e.target.value)}/>
            <button className="loginButton">Log in</button>
            <div>
                {feedback && feedback}
            </div>
        </form>
    )
}

export default Login;

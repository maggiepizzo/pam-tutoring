import { useState } from 'react';
import { createUserWithEmailAndPassword,  updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import PasswordField from './PasswordField.js';
import './App.css';

const CreateAccount = ({auth, users, setUsers, db}) => {
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
        } else if (password1 !== password2) {
            setFeedback("Passwords don't match.")
        } else {
            setFeedback("Creating new account...")
            createUserWithEmailAndPassword(auth, email1, password1)
            .then((userCredential) => {
                const userObject = {
                    id: userCredential.user.uid,
                    email: userCredential.user.email,
                    admin: false,
                    name: firstName + " " + lastName,
                    rate: 100
                }
                setUsers(users.concat([userObject]))
                setDoc(doc(db, "users", userCredential.user.uid), userObject)})
            .catch((error) => {
                console.error(error)
                setFeedback("Could not create account.  Please try again.")})       
        }
    }

    return (
      <form className='loginContainer' onSubmit={(e) => handleCreateAccount(e)}>
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
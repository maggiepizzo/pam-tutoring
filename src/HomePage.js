import './App.css';

const HomePage = () => {
    return (
      <div className="homePage">
        <img  
          src={require('./images/pam.jpg')} 
          alt="Pam on a hike"
        />
        <div>
          <h1>Hi, I'm Pam!</h1>
          <h2>I am a passionate teacher and tutor with over 20 years of experience teaching math, science, and German language.</h2>
          <p> Please create an account or log in to see your schedule and book appointments, or contact me so we can talk more about how we can work together!</p>
        </div>
      </div>
    )
  }

  export default HomePage
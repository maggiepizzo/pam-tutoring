import './App.css';

const HomePage = () => {
    return (
      <div>
      <div className="homePageHeader">
        <img  src={require('./images/pam.jpg')} alt="Image of Pam"/>
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

  export default HomePage
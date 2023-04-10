// https://justacoding.blog/react-calendar-component-example-with-events/
import { useState, useEffect, Fragment } from 'react';
import { v4 as uuid } from 'uuid';
import './Calendar.css'

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
]

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const toStartOfDay = (date) => {
	const newDate = new Date(date)
    newDate.setHours(0)
    newDate.setMinutes(0)
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)
    return newDate
}

const timeString = (time) => {
    let [hours, mins] = [Math.floor(time), time % 1]
    hours = hours % 12
    if (hours == 0) {
        hours = 12
    }
    mins *= 60
    if (mins < 10) {
        mins = "0" + mins
    }
    return hours + ":" + mins + (time < 12 ? " AM" : " PM")
}

const lengthString = (length) => {
    let [hours, mins] = [Math.floor(length), (length % 1) * 60]
    return (hours > 0 ?  hours + " hr" : "") + (mins > 0 ? " " + mins + " min" : "")
}

const findEventsForDate = (events, dateString) => {
    let dateEvents = events.filter(event => {
        return event.dateString === dateString
    })
    return dateEvents.sort(function (a, b) {
        return a.time - b.time;
    })
}

const getTimeOptions = (dateAvailability, availability = null, withEvent = null) => {
    // need to add back in current time using updateAvailability -- but i don't want to ACTUALLY set the availabilty,
    // just return it here so I can use it to see my options :)
    if (withEvent && availability) {
      dateAvailability = increaseAvailability(withEvent, availability)
    }
    let startTimes = {}
    console.log(dateAvailability)
    console.log(dateAvailability.times)
    for (const chunk of dateAvailability.times) {
        let startTime = Number(chunk[0])
        while (startTime < Number(chunk[1])) {
            let lengths = []
            let length = 0.5    // this is our "min session time" -- can add a variable for it later
            while (startTime + length <= chunk[1] && length <= 3) {     // 3 = max session time
                lengths.push(length)
                length += 0.25
            }
            if (lengths.length > 0) {
                startTimes[startTime] = lengths
            }
            startTime += 0.25   // quarter hour increments
        }
    }
    return startTimes
}

const getTimeArray = (start, end, step) => {
    var list = [];
    for (var i = start; i <= end; i+=step) {
        list.push(i);
    }
    return list
}

const reduceAvailability = (session, availability) => {
    const startTime = Number(session.time)
    const endTime = startTime + Number(session.length)
    const dateAvailability = findEventsForDate(availability, session.dateString)[0]
    let times = dateAvailability.times
    for (let i = 0; i < times.length; i++) {
        if (times[i][0] == startTime) {
            if (times[i][1] == endTime) {
                times = times.slice(0, i).concat(times.slice(i+1))
            } else {
                const newChunk = [[endTime, times[i][1]]]
                times = times.slice(0, i).concat(newChunk).concat(times.slice(i+1))
            }
            break
        } else if (times[i][0] < startTime) {
            if (times[i][1] == endTime) {
                const newChunk = [[times[i][0], startTime]]
                times = times.slice(0, i).concat(newChunk).concat(times.slice(i+1))
                break
            } else if (times[i][1] > endTime) {
                const newChunks = [[times[i][0], startTime], [endTime, times[i][1]]]
                times = times.slice(0, i).concat(newChunks).concat(times.slice(i+1))
                break
            }
        }
    }
    return {...dateAvailability, times: times}
}

const increaseAvailability = (session, availability) => {
  const startTime = Number(session.time)
  const endTime = startTime + Number(session.length)
  const dateAvailability = findEventsForDate(availability, session.dateString)[0]
  let times = dateAvailability.times
  for (let i = 0; i < times.length; i++) {
      if (times[i][1] == startTime) {
          if (i+1 < times.length && times[i+1][0] == endTime) {
              const newChunk = [[times[i][0], times[i+1][1]]]
              times = times.slice(0, i).concat(newChunk).concat(times.slice(i+2))
          } else {
              const newChunk = [[times[i][0], endTime]]
              times = times.slice(0, i).concat(newChunk).concat(times.slice(i+1))
          }
          break
      } else if (times[i][1] < startTime) {
          if (i+1 < times.length && times[i+1][0] == endTime) {
              const newChunk = [[startTime, times[i+1][1]]]
              times = times.slice(0, i+1).concat(newChunk).concat(times.slice(i+2))
              break
          } else if (i == times.length-1 || times[i+1][0] > endTime) {
              const newChunk = [[startTime, endTime]]
              times = times.slice(0, i+1).concat(newChunk).concat(times.slice(i+1))
              break
          }
      }
  }
  return {...dateAvailability, times: times}
}

// Top bar, contains the month/year combo as well as back/forward links
const Navigation = ({ date, setDate, setShowingEventForm }) => {
  return (
    <div className="navigation">
      <div className="back" onClick={() => {
          const newDate = new Date(date)
          newDate.setMonth(newDate.getMonth() - 1)
          setDate(newDate)
        }}>
          <i className="arrow left"></i> {MONTHS[date.getMonth() == 0 ? 11 : date.getMonth() - 1]}
      </div>

      <div className="today" onClick={() => setDate(new Date())}>Today</div>

      <div className="monthAndYear">
        {MONTHS[date.getMonth()]} {date.getFullYear()}
      </div>

      <div className="forward" onClick={() => {
          const newDate = new Date(date)
          newDate.setMonth(newDate.getMonth() + 1)
          setDate(newDate)
        }}>
          {MONTHS[date.getMonth() == 11 ? 0 : date.getMonth() + 1]} <i className="arrow right"></i>
      </div>
    </div>
  )
}

// Week day headers: Mon, Tue, Wed etc
const DayLabels = () => {
  return DAYS_SHORT.map((dayLabel, index) => {
    return <div className="dayLabel cell" key={index}>{dayLabel}</div>
  })
}

// An event displayed within the calendar grid, can be clicked to open main event view
const MiniEvent = ({ event, setViewingEvent }) => {
    return (
        <button
        className={`miniEvent ${event.type}`}
        disabled={Date.parse(event.date) < toStartOfDay(new Date())}
        onClick={() => setViewingEvent(event)}>
        {event.type} at {event.timeString} for {event.lengthString}
        </button>
    )
}

// The main event view (opens in modal)
const Event = ({ event, setViewingEvent, setShowingEventForm, deleteEvent, availability, admin }) => {
  const title = admin ? 
    `${event.type} with ${event.user.name} at ${timeString(parseFloat(event.time))}` :
    `${event.type} at ${timeString(parseFloat(event.time))}`
  
  const dateAvailability = findEventsForDate(availability, event.dateString)
  return (
    <Modal onClose={() => setViewingEvent(null)} title={title} className="eventModal">
      <p>{event.meta && "Notes: " + event.meta}</p>
      <div style={{display: 'flex'}}>
        <button 
            onClick={() => {
                setViewingEvent(null)
                setShowingEventForm({ visible: true, withEvent: event, dateAvailability: dateAvailability.length > 0 ? dateAvailability[0] : []})
            }}>
            Edit Session
        </button>
        <button className="red" onClick={() => deleteEvent(event)}>
            Delete Session
        </button>
      </div>
      <a className="close" onClick={() => setViewingEvent(null)}/>
    </Modal>
  )
}

// Form to add new sessions and edit existing sessions
const EventForm = ({ setShowingEventForm, addEvent, editEvent, withEvent, setViewingEvent, preselectedDate, user, dateAvailability, availability, users }) => {
  const timeOptions = getTimeOptions(dateAvailability, availability, withEvent)
  const defaultTime = Object.keys(timeOptions).length > 0 ? Object.keys(timeOptions)[0] : null
  const defaultType = 'Tutoring'
  const defaultLength = 1
  const newEvent = withEvent || {
    id: uuid(),
    type: defaultType,
    date: preselectedDate,
    dateString: preselectedDate.toDateString(), 
    time: defaultTime, 
    timeString: timeString(defaultTime),
    length: defaultLength,
    lengthString: lengthString(defaultLength),
    user: {id:user.id, email:user.email, name:user.name}}
  const [event, setEvent] = useState(newEvent)

  return (
    <Modal onClose={() => setShowingEventForm({ visible: false })} title={`${withEvent ? "Edit Session" : "Schedule New Session"}`}>
      <div className="form">
        
        <label>Date
        <select value={event.date} disabled={true} onChange={(e) => setEvent({ ...event, date: e.target.value })}>
            <option value={event.date}>{event.dateString}</option>
          </select>
        </label>
        
        <label>Time
          <select value={event.time} onChange={(e) => {
            setEvent({ ...event, time: e.target.value, timeString: timeString(e.target.value)})
        }}>
            {Object.keys(timeOptions).sort(function(a,b) {return a-b}).map(time => <option key={time} value={time}>{timeString(time)}</option>)}
          </select>
        </label>
                
        <label>Length
          <select value={event.length} onChange={(e) => {
            setEvent({ ...event, length: e.target.value, lengthString: lengthString(e.target.value) })
        }}>
            {timeOptions[event.time].map(length => <option value={length}>{lengthString(length)}</option>)}
          </select>
        </label>

       <label>Type
          <select value={event.type} onChange={(e) => setEvent({ ...event, type: e.target.value })}>
            <option value="Tutoring">Tutoring</option>
            <option value="Consult">Consult</option>
          </select>
        </label>

        <label>Details
          <input 
            type="text" 
            placeholder="Any additional details" 
            defaultValue={event.meta} 
            onChange={(e) => setEvent({ ...event, meta: e.target.value })} />
        </label>

        {user.admin && <label>User
          <select value={event.user} onChange={(e) => setEvent({ ...event, user: {id: e.target.value.id, email: e.target.value.email, name: e.target.value.name } })}>
            {users.map(u => <option value={u}>{u.name}</option>)}
          </select>
        </label>}

        {withEvent ? (
        	<Fragment>
            <button onClick={() => editEvent(event)} disabled={event == withEvent}>Save Session</button>
            <a className="close" onClick={() => {
            	setShowingEventForm({ visible: false })
            	setViewingEvent(null)}
            }/>
          </Fragment>
        ) : (
        	<Fragment>
            <button onClick={() => addEvent(event)}>Schedule Session</button>
            <a className="close" onClick={() => {
                setShowingEventForm({ visible: false })}
            }/>
          </Fragment>
        )}
      </div>
    </Modal>
  )
}

// Form to for admin to edit availability
const AvailabilityForm = ({ setShowingAvailabilityForm, preselectedDate, prebookedSessions, withEvent, editAvailability, addAvailability }) => {
    const maxStartTime = prebookedSessions.length > 0 ? prebookedSessions[0].time : 20
    const minEndTime = prebookedSessions.length > 0 ? 
        Number(prebookedSessions[prebookedSessions.length-1].time) + Number(prebookedSessions[prebookedSessions.length-1].length) : 
        8.5
    const defaultStartTime = Math.min(10, maxStartTime)
    const defaultEndTime = Math.max(16, minEndTime)
   
    const newEvent = withEvent || {
        id: uuid(),
        date: preselectedDate,
        dateString: preselectedDate.toDateString(),
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        times: [[defaultStartTime, defaultEndTime]],
    }
    
    const [event, setEvent] = useState(newEvent)
  
    return (
      <Modal onClose={() => setShowingAvailabilityForm({ visible: false })} title={`Edit Availability`}>
        <div className="form">
          
          <label>Date
          <select value={event.date} disabled={true} onChange={(e) => setEvent({ ...event, date: e.target.value })}>
              <option value={event.date}>{event.dateString}</option>
            </select>
          </label>
          
          <label>Start Time
            <select value={event.startTime} onChange={(e) => {
                if (withEvent) {
                    const startChunk = [e.target.value, withEvent.times[0][1]]
                    setEvent({ ...event, startTime: e.target.value, times: [startChunk].concat(withEvent.times.slice(1))})
                }
                else {
                    setEvent({ ...event, startTime: e.target.value, times: [[e.target.value, event.endTime]]})
                }              
          }}>
              {getTimeArray(8, maxStartTime, 0.25).map(time => <option key={time} value={time}>{timeString(time)}</option>)}
            </select>
          </label>
                  
          <label>End Time
            <select value={event.endTime} onChange={(e) => {
              if (withEvent) {
                const endChunk = [withEvent.times[withEvent.times.length-1][0], e.target.value]
                setEvent({ ...event, startTime: e.target.value, times: withEvent.times.slice(0,withEvent.length-1).concat[[endChunk]]})
            }
            else {
                setEvent({ ...event, endTime: e.target.value, times: [[event.startTime, e.target.value]]})
            }       
          }}>
              {getTimeArray(Math.max(Number(event.startTime) + 0.5, minEndTime), 20, 0.25).map(time => <option key={time} value={time}>{timeString(time)}</option>)}
            </select>
          </label>
  
          {withEvent ? (
              <Fragment>
              <button onClick={() => editAvailability(event)} disabled={event == withEvent}>Save Availability</button>
              <a className="close" onClick={() => {
                  setShowingAvailabilityForm({ visible: false })}
              }/>
            </Fragment>
          ) : (
              <Fragment>
              <button onClick={() => addAvailability(event)}>Set Availability</button>
              <a className="close" onClick={() => {
                  setShowingAvailabilityForm({ visible: false })}
              }/>
            </Fragment>
          )}
        </div>
      </Modal>
    )
  }

// Generic component - modal to present children within
const Modal = ({ children, onClose, title, className }) => {
  return (
    <Fragment>
      <div className="overlay" onClick={onClose} />
      <div className={`modal ${className}`}>
        <h3>{title}</h3>
        <div className="inner">
          {children}
        </div>
      </div>
    </Fragment>
  )
}

// Generic component - a nicely animated loading spinner
const Loader = () => {
  return (
    <Fragment>
      <div className="overlay" />
      <div className="loader">
        <div className="lds-roller">
          <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>  
        </div>
      </div>
    </Fragment>
  )
}

// Generic component - simple feedback after an action has taken place
const Feedback = ({ message, type }) => {
  return (
    <div className={`feedback ${type}`}>{message}</div>
  )
}

// Renders a month's worth of days and also populates the bookedSessions on the relevant dates
const Grid = ({ date, bookedSessions, availability, setViewingEvent, setShowingEventForm, setShowingAvailabilityForm, actualDate, admin }) => {
  const DAYS_IN_WEEK = 7

  const currentDate = toStartOfDay(new Date())
  const startingDate = new Date(date.getFullYear(), date.getMonth(), 1)

  const numDaysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const numExtraStartDays = startingDate.getDay()
  const rowCount = Math.ceil((numDaysInMonth + numExtraStartDays) / DAYS_IN_WEEK)

  startingDate.setDate(startingDate.getDate() - numExtraStartDays)
  
  const dates = []
  for (let i = 0; i < (rowCount * DAYS_IN_WEEK); i++) {
    const date = new Date(startingDate)
    dates.push({ date, bookedSessions: findEventsForDate(bookedSessions, date.toDateString()), availability: findEventsForDate(availability, date.toDateString()) })
    startingDate.setDate(startingDate.getDate() + 1)
  }

//   TODO: make it so the cells expand based on the largest height of the dates in that week
  return (
    <Fragment>
      {dates.map((date, index) => {
        return (
          <div 
            key={index}
            className={`cell ${date.date.getTime() == currentDate.getTime() ? "current" : ""} ${date.date.getMonth() != actualDate.getMonth() ? "otherMonth" : ""}`
						}>
            <div className="dateContainer">
                <div className="date">
                    {date.date.getDate()}
                </div>
                {date.date >= currentDate && date.availability.length > 0 && Object.keys(getTimeOptions(date.availability[0])).length > 0 &&
                    <a 
                        className="addEventOnDay" 
                        onClick={() => setShowingEventForm({ visible: true, preselectedDate: date.date, dateAvailability: date.availability[0] })}>
                        Add Session +
                    </a>}
                {admin && date.date >= currentDate &&
                    <a 
                        className="addEventOnDay" 
                        onClick={() => setShowingAvailabilityForm({ visible: true, withEvent: date.availability[0], preselectedDate: date.date, prebookedSessions: date.bookedSessions })}>
                        {date.availability.length > 0 ? 
                        `Available ${timeString(date.availability[0].startTime)}-${timeString(date.availability[0].endTime)}` :
                         "Add Availability +"}
                    </a>}
            </div>
            {date.bookedSessions.map((event, index) => 
                <MiniEvent key={index} event={event} setViewingEvent={setViewingEvent} />
            )}
          </div>
        )
      })}
    </Fragment>
  )
}

// The "main" component, our actual calendar
const Calendar = ({ loadedBookedSessions = [], loadedAvailability = [], user, users }) => {
  const [date, setDate] = useState(new Date())
  const [viewingEvent, setViewingEvent] = useState(false)
  const [showingEventForm, setShowingEventForm] = useState({ visible: false })
  const [showingAvailabilityForm, setShowingAvailabilityForm] = useState( { visible: false })
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState()
  const [bookedSessions, setBookedSessions] = useState(loadedBookedSessions)
  const [availability, setAvailability] = useState(loadedAvailability)

  const showFeedback = ({ message, type, timeout = 1000 }) => {
    setFeedback({ message, type })
    setTimeout(() => {
      setFeedback(null)
    }, timeout)
  }

  const addAvailability = (event) => {
    setIsLoading(true)
    setShowingAvailabilityForm({ visible: false })
    fetch('http://localhost:5000/availability', {
        method: 'POST',
        headers: {
        'Content-type': 'application/json',
        },
        body: JSON.stringify(event),
    })
    .then(() => {
        setAvailability(availability.concat([event]))
        setIsLoading(false)
    })
  }

  const editAvailability = (event) => {
    setIsLoading(true)
    setShowingAvailabilityForm({ visible: false })
    fetch('http://localhost:5000/availability' + '/' + event.id, {
        method: 'PUT',
        headers: {
        'Content-type': 'application/json',
        },
        body: JSON.stringify(event),
    })
    .then(() => {
        setAvailability(availability.map(e =>  e.id === event.id ? event : e))
        setIsLoading(false)
    })
  }

  const addSession = (event) => {
    setIsLoading(true)
    setShowingEventForm({ visible: false })
    fetch('http://localhost:5000/sessions', {
        method: 'POST',
        headers: {
        'Content-type': 'application/json',
        },
        body: JSON.stringify(event),
    })
    .then(() => {
        setBookedSessions(bookedSessions.concat([event]))
        const newEvent = reduceAvailability(event, availability)
        editAvailability(newEvent)
        showFeedback({ message: "New session scheduled", type: "success" })
    })
  }

  const editSession = (event) => {
    setIsLoading(true)
    setShowingEventForm({ visible: false })
    fetch('http://localhost:5000/sessions' + '/' + event.id, {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(event),
      })
      .then(() => {
        const oldEvent = bookedSessions.filter(e => e.id === event.id)[0]
        let newAvailability = increaseAvailability(oldEvent, availability)
        newAvailability = reduceAvailability(event, availability)
        setBookedSessions(bookedSessions.map(e =>  e.id === event.id ? event : e))
        editAvailability(newAvailability)
        setIsLoading(false)
        showFeedback({ message: "Session saved", type: "success" })
    })
  }

  const deleteSession = (event) => {
    setIsLoading(true)
    setViewingEvent(null)
    fetch('http://localhost:5000/sessions' + '/' + event.id, {
        method: 'DELETE',
        headers: {
          'Content-type': 'application/json',
        },
      })
      .then(() => {
        setBookedSessions(bookedSessions.filter(e =>  e.id !== event.id))
        const newEvent = increaseAvailability(event, availability)
        editAvailability(newEvent)
        setIsLoading(false)
        showFeedback({ message: "Session deleted", type: "success" })
    })
  }

  return (
    <div className="calendar">
      {isLoading && <Loader />}

      {feedback && 
      	<Feedback 
          message={feedback.message} 
          type={feedback.type} 
         />
       }

      <Navigation 
        date={date} 
        setDate={setDate}
        setShowingEventForm={setShowingEventForm} 
      />

      <DayLabels />

      <Grid
        date={date}
        bookedSessions={bookedSessions}
        availability={availability}
        setShowingEventForm={setShowingEventForm} 
        setShowingAvailabilityForm={setShowingAvailabilityForm}
        setViewingEvent={setViewingEvent} 
        actualDate={date}
        admin={user.admin}
      />

      {viewingEvent && 
        <Event 
          event={viewingEvent} 
          setShowingEventForm={setShowingEventForm}
          setViewingEvent={setViewingEvent} 
          deleteEvent={deleteSession} 
          availability={availability}
          admin={user.admin}
        />
      }

      {showingEventForm && showingEventForm.visible &&
        <EventForm 
          withEvent={showingEventForm.withEvent}
          preselectedDate={showingEventForm.preselectedDate}
          setShowingEventForm={setShowingEventForm} 
          addEvent={addSession}
          editEvent={editSession}
          setViewingEvent={setViewingEvent}
          user={user}
          dateAvailability={showingEventForm.dateAvailability}
          availability={availability}
          users={users}
        />
      }

      {showingAvailabilityForm && showingAvailabilityForm.visible &&
        <AvailabilityForm
          withEvent={showingAvailabilityForm.withEvent}
          preselectedDate={showingAvailabilityForm.preselectedDate}
          prebookedSessions={showingAvailabilityForm.prebookedSessions}
          setShowingAvailabilityForm={setShowingAvailabilityForm} 
          addAvailability={addAvailability}
          editAvailability={editAvailability}
        />
      }   

    </div>
  )
}

export default Calendar;
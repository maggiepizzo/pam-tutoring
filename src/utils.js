const timeString = (time) => {
    let [hours, mins] = [Math.floor(parseFloat(time)), parseFloat(time) % 1]
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
    let [hours, mins] = [Math.floor(parseFloat(length)), (parseFloat(length) % 1) * 60]
    return (hours > 0 ?  hours + " hr" : "") + (mins > 0 ? " " + mins + " min" : "")
  }
  
const typeString = (type) => {
    if (type === "in-person") {
      return "In Person"
    }  else if (type == "remote") {
      return "Remote"
    } else {
      return type
    }
  }

export { typeString, timeString, lengthString }
  
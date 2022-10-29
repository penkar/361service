const express = require("express");
const app = express();
const cors = require("cors");

const {
  PORT,
  weatherbitAccessKeypositionStackAccessKey,
  positionStackAccessKey,
} = require("./Secrets");

app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  const {
    addressString = undefined,
    lat = undefined,
    long = undefined,
  } = req.query;

  const response = await getWeatherResponse({ addressString, lat, long });
  let status = 200;
  if (response.error) status = 300;
  res.status(200).send(response);
});

app.listen(PORT, () => {
  console.log(
    `Express started on http://localhost:${PORT} press ctrl-C to terminate.`
  );
});

/*  lat: String - End user's latitude.
    lon: String - End user's longitude. */
const getWeather = (lat, lon) =>
  fetch(
    `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&appid=${weatherbitAccessKey}`
  )
    .then((response) => response.json())
    .catch((error) => ({
      error: error,
      message: "An error was encountered while retrieving your weather data.",
    }));

/*  @addressString: String - URI Encoded string address. 
    How do I URI encode a string? Call encodeURIComponent(originalString)
    when making the request from the browser.*/
const getLatLong = (addressString) =>
  // https://positionstack.com/
  fetch(
    `http://api.positionstack.com/v1/forward?access_key=${positionStackAccessKey}&query=${addressString}`
  )
    .then((response) => response.json())
    .then((response) => {
      try {
        const { latitude, longitude } = response?.data[0];
        return { latitude, longitude };
      } catch (error) {
        return {
          error,
          message:
            "An error was encountered while parsing the lattitude and longitude data",
        };
      }
    })
    .catch((error) => {
      return {
        error,
        message:
          "An error was encountered while getting the lattitue and longitude data",
      };
    });

/*  @addressString: String - Address String 
    @lat: String - Latitude String
    @long: String - Longitude String */
const getWeatherResponse = async ({ addressString, lat, long }) => {
  /* https://openweathermap.org/ */
  let results = { error: null };
  if (lat && long) {
    results = await getWeather(lat, long);
  } else if (addressString) {
    const { error, latitude, longitude, message } = await getLatLong(
      addressString
    );
    if (error) {
      results.error = error;
      results.message = message;
    } else {
      results = await getWeather(latitude, longitude);
    }
  } else {
    results.error = "Invalid inputs were provided.";
    results.message =
      "Please provide either the latitude (lat) & longitude (long) or a comlete address (addressString).";
  }

  return results;
};

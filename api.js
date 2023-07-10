const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://vermadipshi70:G61oB0WQ2LJtUNOG@getapi.fyc04qi.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a coin schema
const coinSchema = new mongoose.Schema({
  symbol: { type: String, unique: true },
  name: { type: String, unique: true },
  marketCapUsd: String,
  priceUsd: String,
});

// Create a coin model
const Coin = mongoose.model('Coin', coinSchema);

// Create Express app
//handle the routing and middleware of api
const app = express();

// Fetch the top 100 coins and save them in the database
/**The /coins route handler fetches the top 100 coins from the CoinCap API and
 *  saves them in the MongoDB database using the Coin.findOneAndUpdate() method with the upsert:
 *  true option. This ensures that if the coin already exists
 *  in the database, it will be updated, and if it doesn't exist, a new document will be created. */
app.get('/coins', async (req, res) => {
  try {
     // Delete all existing coins from the database
     await Coin.deleteMany({});

    const response = await axios.get('https://api.coincap.io/v2/assets', {
      headers: { 'Authorization': 'Bearer 56d6bf3f-8cf6-42da-bb3e-aa604cbaefc8' },
      params: { limit: 100 },
    });

    const coins = response.data.data;

    // Save each coin in the database
    for (const coin of coins) {
      await Coin.findOneAndUpdate(
        { symbol: coin.symbol },
        coin,
        { upsert: true }
      );
    }

    res.status(200).json({ message: 'Coins saved successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching and saving coins.' });
  }
});

app.get('/coins/sorted', async (req, res) => {
  try {
    const coins = await Coin.find();

    // Fetch the previous price value for each coin
    for (const coin of coins) {
      const previousCoin = await Coin.findOne({ symbol: coin.symbol }).sort({ _id: -1 });

      if (previousCoin) {
        const previousPrice = parseFloat(previousCoin.priceUsd);
        const currentPrice = parseFloat(coin.priceUsd);

        // Calculate the growth percentage
        const changePercent24Hr = ((currentPrice - previousPrice) / previousPrice) * 100;

        // Update the changePercent24Hr field in the document
        coin.changePercent24Hr = changePercent24Hr;
      } else {
        // Set changePercent24Hr as 0 if there is no previous price data
        coin.changePercent24Hr = 0;
      }
    }

    // Sort the coins based on the growth percentage
    const sortedCoins = coins.sort((a, b) => b.changePercent24Hr - a.changePercent24Hr);
    res.status(200).json(sortedCoins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while retrieving and sorting coins.' });
  }
});




// Get the sorted list of coins based on their growth in the last 24 hours
/** The /coins/sorted route handler retrieves the coins from the database and returns the sorted list based on
 *  their growth in the last 24 hours, using the Coin.find().sort({ changePercent24Hr: -1 }) query. */


// app.get('/coins/sorted', async (req, res) => {
//   try {
//     const sortedCoins = await Coin.find().sort({ changePercent24Hr: -1 });

//     res.status(200).json(sortedCoins);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'An error occurred while retrieving and sorting coins.' });
//   }
// });





/** The /coins/list route handler fetches all the coins from the database and returns them as a JSON response. */
app.get('/coins/list', async (req, res) => {
    try {
      const coins = await Coin.find();
      res.status(200).json(coins);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while retrieving coins from the database.' });
    }
  });+

  

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


/* without saving data in mongodb atlas
app.get('/coins', async (req, res) => {
  try {
    const response = await axios.get('https://api.coincap.io/v2/assets', {
      headers: { 'Authorization': 'Bearer 56d6bf3f-8cf6-42da-bb3e-aa604cbaefc8' },
      params: { limit: 100 },
    });

    const coins = response.data.data;

    res.status(200).json(coins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching and sending coins.' });
  }
});
*/ 

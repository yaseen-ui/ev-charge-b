const app = require('./src/app');
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`EV Charging Station Load Balancer running on port ${PORT}`);
});

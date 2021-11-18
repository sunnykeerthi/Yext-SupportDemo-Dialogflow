const express = require("express");
const { WebhookClient, Card } = require("dialogflow-fulfillment");
const dfff = require("dialogflow-fulfillment");
const app = express();
var axios = require("axios");
const { provideCore } = require("@yext/answers-core");

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Server Is Working......");
});
const core = provideCore({
  apiKey: "aae767ec8fa55d59cced70dc2a1377b8",
  experienceKey: "answers-help-site",
  locale: "en",
  experienceVersion: "PRODUCTION",
  /*endpoints: {
    universalSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/query",
    verticalSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/query",
    questionSubmission:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/createQuestion",
    status: "https://answersstatus.pagescdn.com",
    universalAutocomplete:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/autocomplete",
    verticalAutocomplete:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/autocomplete",
    filterSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/filtersearch",
  },*/
});
/**
 * on this route dialogflow send the webhook request
 * For the dialogflow we need POST Route.
 * */
app.post("/webhook", (req, res) => {
  var query = req.body.queryResult.queryText;
  // get agent from request
  const agent = new WebhookClient({ request: req, response: res });
  // create intentMap for handle intent
  const intentMap = new Map();
  const options = { sendAsMessage: true, rawPayload: true };
  // add intent map 2nd parameter pass function
  intentMap.set("Default Fallback Intent", handleFallback);

  agent.handleRequest(intentMap);

  async function handleFallback(agent) {
    const res = await retData(await query);
    agent.add(new Card(res));
  }

  async function retData(queryString) {
    try {
      const result = await core.universalSearch({
        query: queryString,
      });
      var answerJson = result.verticalResults[0].results[0].rawData;
      var answerText = answerJson.description
        ? answerJson.description
        : answerJson.answer;
      var richResult = {};
      richResult.title = queryString;
      if (answerText) {
        richResult.text = answerText;
      }

      if (answerJson.c_photo) {
        richResult.imageUri = answerJson.c_photo.url;
      }

      if (answerJson.c_primaryCTA) {
        var buttons = [];
        var primaryButton = {};
        primaryButton.text = answerJson.c_primaryCTA.label;
        primaryButton.postback = answerJson.c_primaryCTA.link;
        buttons.push(primaryButton);
        if (answerJson.c_secondaryCTA) {
          var secondaryButton = {};
          secondaryButton.text = answerJson.c_primaryCTA.label;
          secondaryButton.postback = answerJson.c_primaryCTA.link;
          buttons.push(secondaryButton);
          if (answerJson.tertiaryCTA) {
            var teriataryButton = {};
            teriataryButton.text = answerJson.c_primaryCTA.label;
            teriataryButton.postback = answerJson.c_primaryCTA.link;
            buttons.push(teriataryButton);
          }
        }
        richResult.buttons = buttons;
      }
      console.log(richResult);
      return richResult;
    } catch (err) {
      return err;
    }
  }
});
/**
 * now listing the server on port number 3000 :)
 * */
app.listen(3000, () => {
  console.log("Server is Running on port 3000");
});

const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const dfff = require("dialogflow-fulfillment");
const app = express();
var axios = require("axios");
const { provideCore } = require("@yext/answers-core");
const PORT = process.env.PORT || 3000;
const removeMd = require("remove-markdown");

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Server Is Working......");
});
const core = provideCore({
  apiKey: process.env.API_KEY,
  experienceKey: process.env.EXPERIENCE_KEY,
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
    agent.add(new dfff.Payload(agent.UNSPECIFIED, res, options));
  }

  async function retData(queryString) {
    try {
      const result = await core.universalSearch({
        query: queryString,
      });
      var answerJson;
      if (
        result.verticalResults[0].results[0].rawData.type.toLowerCase() ==
        "youtube_video"
      ) {
        answerJson = result.verticalResults[1].results[0].rawData;
      } else {
        answerJson = result.verticalResults[0].results[0].rawData;
      }
       var answerText =
        answerJson.description ||
        answerJson.answer ||
        answerJson.body ||
        answerJson.richTextDescription;
      var richResult = {
        richContent: [[]],
      };
      if (answerJson.c_photo) {
        var img = {
          type: "image",
          rawUrl: answerJson.c_photo.url,
          accessibilityText: "Dialogflow across platforms",
        };
        richResult.richContent[0].push(img);
      } 
      if (answerText) {
        var ansr = {
          type: "info",
          subtitle: removeMd(answerText),
        };
        richResult.richContent[0].push(ansr);
      }
      if (answerJson.c_primaryCTA) {
        var chips = {
          type: "chips",
          options: [
            {
              text: answerJson.c_primaryCTA.label,
              link: answerJson.c_primaryCTA.link,
            },
          ],
        };
        if (answerJson.c_secondaryCTA) {
          var options2 = {
            text: answerJson.c_secondaryCTA.label,
            link: answerJson.c_secondaryCTA.link,
          };
          chips.options.push(options2);
        }
        if (answerJson.tertiaryCTA) {
          var options3 = {
            text: answerJson.tertiaryCTA.label,
            link: answerJson.tertiaryCTA.link,
          };
          chips.options.push(options3);
        }
        richResult.richContent[0].push(chips);
      }

      if (answerJson.type == "ce_promo") {
        var subRes = [];
        var answerJson = result.verticalResults[1].results[0].rawData;
        var answerText =
          answerJson.description ||
          answerJson.answer ||
          answerJson.body ||
          answerJson.richTextDescription;

        if (answerJson.c_photo) {
          var img = {
            type: "image",
            rawUrl: answerJson.c_photo.url,
            accessibilityText: "Dialogflow across platforms",
          };
          subRes.push(img);
        } 
         if (answerText) {
          var ansr = {
            type: "info",
            subtitle: removeMd(answerText),
          };
          subRes.push(ansr);
        }
        if (answerJson.c_primaryCTA) {
          var chips = {
            type: "chips",
            options: [
              {
                text: answerJson.c_primaryCTA.label,
                link: answerJson.c_primaryCTA.link,
              },
            ],
          };
          if (answerJson.c_secondaryCTA) {
            var options2 = {
              text: answerJson.c_secondaryCTA.label,
              link: answerJson.c_secondaryCTA.link,
            };
            chips.options.push(options2);
          }
          if (answerJson.tertiaryCTA) {
            var options3 = {
              text: answerJson.tertiaryCTA.label,
              link: answerJson.tertiaryCTA.link,
            };
            chips.options.push(options3);
          }
          subRes.push(chips);
          richResult.richContent.push(subRes);
        }
       }
      return richResult;
    } catch (err) {
      return err;
    }
  }
});
/**
 * now listing the server on port number 3000 :)
 * */
app.listen(PORT, () => {
  console.log("Server is Running on port 3000");
});

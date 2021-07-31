const formsg = require('@opengovsg/formsg-sdk')()
const postURL = `${POST_URL}`
const formSecretKey  = `${FORM_KEY}`
const HAS_ATTACHMENTS = false

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});

async function readRequestBody(request) {
  const { headers } = request
  const contentType = headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return JSON.stringify(await request.json())
  }
  else if (contentType.includes("application/text")) {
    return request.text()
  }
  else if (contentType.includes("text/html")) {
    return request.text()
  }
  else if (contentType.includes("form")) {
    const formData = await request.formData()
    const body = {}
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1]
    }
    return JSON.stringify(body)
  }
  else {
    const myBlob = await request.blob()
    const objectURL = URL.createObjectURL(myBlob)
    return objectURL
  }
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  //* Logging
  // sendSlackString("CALLING URL: " + request.url);

  if (request.method === "POST") {
    return await processRequest(await readRequestBody(request));
  }else if(request.method === "GET") {
    return new Response("Expected POST", { status: 500 })
  }
}

async function processRequest(request){
   //* Logging
  // sendSlackString("processRequest: " + JSON.stringify(request));
  let decryptedRequest = await decryptRequest(request)
  // let filteredText = await filterRequest(decryptedRequest)
  if (decryptedRequest){
    //* Logging
    sendSlackString("decryptedResponse: " + JSON.stringify(decryptedRequest));
      const options = {
      method: 'POST',
      headers: {
        'Content-Type':'application/json'
      },
      body: JSON.stringify(
        { 
          "text": decryptedRequest
        }
      )
    }
   return await fetch(postURL,options);
  }
  else{
    setTimeout(500)
    return JSON.stringify({})
  }
}

async function decryptRequest(request){
  //* Logging
  // sendSlackString("decryptingRequest: " + JSON.stringify(request))
  return formsg.crypto.decrypt(formSecretKey, JSON.parse(request).data)
}


/* 
* Logging Function - Sends text to Slack 
*/
async function sendSlackString(text) {

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      {
        "text": text
      }
    )
  }
  return await fetch(postURL, options);
}

/* 
@response is an array of objects 
*/
// async function filterRequest(response){
//   let answers = await response.filter((q) => {
//     return q.answer != ""
//   })
//   let text = ""
//   answers.forEach(qna => {
//     text += qna.question + ": " + qna.answer + `\n`
//   });

//   return text
// }
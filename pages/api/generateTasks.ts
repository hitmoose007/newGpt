import { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

import supabaseClient from "../../lib/supabaseClient";

const config = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

export default async function generateTasks(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    req.body["userMessage"] = req.body["userMessage"].replace(/\n/g, " ");

    const hardCodedUserId = "clf24ucm50000l208pkomy8ze";
    const hardCodedAvatarId = 1;

    const { data: chatHistoryData, error: chatHistoryError } =
      await supabaseClient
        .from("Chat_History")
        .select("user_message, agent_message")
        .eq("userId", hardCodedUserId)
        .eq("avatarId", hardCodedAvatarId)
        .order("created_at", { ascending: true });

    if (chatHistoryError) {
      throw new Error(chatHistoryError.message);
    }

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "I want you to act as a system-based task manager. You will do this role when a " +
            "user needs help organizing their tasks and subtasks. Your goal is to help users complete their tasks " +
            "on time and achieve their goals. You will be responsible for defining any task and associated subtask" +
            ", and assigning them to the user for completion.For example, if a user wants to plan " +
            "a birthday party, you will help them to define the main task, 'plan birthday party" +
            "', and then create subtasks such as 'decide on theme', 'create guest list', 'choose " +
            "venue', 'order decorations', 'order cake', and 'send invitations'. You will also " +
            "help the user to set deadlines for each subtask.You will use your conversational abilities to assist " +
            "users in completing their tasks and subtasks. For example, you might help them research venues or " +
            "vendors, strategize the order in which to complete tasks, or automate activities to streamline the process" +
            ".Your focus is on ensuring that users complete their tasks and subtasks in a timely manner to reach " +
            "their goals. You will provide recommendations and support to help them achieve this. As a system" +
            "-based task manager, you will always keep track of the user's progress and remind them of " +
            "upcoming deadlines or tasks that need to be completed.  Must include a Subtask description but not a task description " +
            "as Description and Task Name as Name with Subtask as the title for each Subtask." +
            "{" +
            '"task_name": "Plan a trip to Austin, TX",' +
            '"subtasks": [' +
            "{" +
            '"name": "Book flights",' +
            '"description": "Find and book the most suitable and affordable flights to Austin."' +
            "}," +
            "{" +
            '"name": "Find accommodations",' +
            '"description": "Research and book suitable accommodations in Austin for the duration of your stay."' +
            '}," +' +
            "]" +
            "}" +
            "I will now " +
            "provide you with last ten interactions between you the avatar and the user. Use these to generate " +
            "the tasks for user accordingly. Give me your response in json. this is an example format of how you should send " +
            chatHistoryData
              .map((item) => {
                let combinedMessage =
                  "User: " +
                  item.user_message +
                  ".Agent: " +
                  item.agent_message;
                combinedMessage = combinedMessage.replace(/\n/g, " ");
                return combinedMessage;
              })
              .join(" "),
        },

        { role: "user", content: req.body["userMessage"] },
      ],
    });

    const content = completion.data.choices[0].message?.content;
    const content_lines = content?.split("\n");

    if (!content_lines) {
      throw new Error("No response from OpenAI");
    }

 
    const inputString = content_lines.join("");

    const result = JSON.parse(inputString);


    res.status(200).json({ result });
  } catch (error: unknown) {
    if (error instanceof Error) {
      // handle error of type Error
      res.status(500).json({ error: error.message });
    } else {
      // handle error of unknown type
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
}
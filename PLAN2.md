Sending survey link to respondents:

Case 1: Sending fresh surveys 
1. In draft and publish status, creator can add and remove respondents. After adding, it should persist in DB. They should be saved in db not auto sent. On clcik remove should get persisted in DB
2. In live, creator can add respondents whenever they want. If they add new ones, the mails should be sent only to new ones not already added. Mail should be sent only on send in live mode.

Case 2: Sending duplicated surveys to respondents
1. During duplication of surveys, even respondents should be copied
2. In draft and publish status, creator can add and remove respondents. After adding, it should persist in DB. They should be saved in db not auto sent. On clcik remove should get persisted in DB
3. In live, creator can add respondents whenever they want. If they add new ones, the mails should be sent only to new ones not already added. Mail should be sent onsend in live mode.
4. In draft, publish and live status, creator can remove already cloned respondent, when they do that it should get persisted in DB. 

In all these cases, respondent progress should show only those details which are stored in allowed rspondents and groups.
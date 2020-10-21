// import { ProcessBuilder } from "../../../core/Flows/ProcessBuilder";
// import { IProcessContext } from "../../../core/Flows/IProcessContext";

// export function addReservation(dreamId:string) {
//   return new ProcessBuilder<IProcessContext>("flows:omo.dreams.addReservation")
//     .category("Invite someone to dream with you", (build) =>
//       build
//         .step("flows:omo.dreams.addReservation:confirm")
//         .withSideEffect("sideEffects:omo.shell.collectStepResult")
//         .mapOutput("stepResult", "yesNo")
//         .withQuant("OmoInput") // TODO: Add OmoYesNo
//         .withPrompt("Yes/No")
//         .withTitle("Do you want to reservate the Dream with XX% discount?")

//         .step("flows:omo.dreams.addReservation:addReservation")
//         .withSideEffect("sideEffects:omo.dreams.addReservation")
//         .withStaticInput("dreamId", dreamId)
//         .isNonInteractive()
//         .withTitle("Creating your reservation..")
//     ).end()
//     .build();
// }
export const f="";

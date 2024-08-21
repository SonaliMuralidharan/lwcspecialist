// ...
import getBoats from "@salesforce/apex/BoatDataService.getBoats";
import { publish, MessageContext } from "lightning/messageService";
import { wire, LightningElement, api } from "lwc";
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateBoatList from "@salesforce/apex/BoatDataService.updateBoatList";
import {refreshApex} from '@salesforce/apex';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT     = 'Ship it!';
const SUCCESS_VARIANT     = 'success';
const ERROR_TITLE   = 'Error';
const ERROR_VARIANT = 'error';
const COLS = [
  { label: 'Name', fieldName: 'Name', type: 'text', editable: true},
  { label: 'Length', fieldName: 'Length__c', type: 'number', editable: true },
  { label: 'Price', fieldName: 'Price__c', type: 'currency' , editable: true},
  { label: 'Description', fieldName: 'Description__c', type: 'text', editable: true }
];
export default class BoatSearchResults extends LightningElement {
  @api boatTypeId = '';
  selectedBoatId;
  columns = COLS;
  boats;
  isLoading = false;

  connectedCallback(){
    this.boatTypeId = '';
  }

  // wired message context
  @wire(MessageContext)
  messageContext;
  // wired getBoats method 
  @wire(getBoats,{boatTypeId : '$boatTypeId'})
  wiredBoats(result) {
    if(result){
      this.boats = result.data;
    }
   }

  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api
  searchBoats(boatTypeId) {
    this.boatTypeId = boatTypeId;
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
   }
  
  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api
  async refresh() { 
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    refreshApex(this.boats);
    this.isLoading = false;
    this.notifyLoading(this.isLoading);
  }
  
  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) {
    this.selectedBoatId = event.detail.boatId;
    this.sendMessageService(this.selectedBoatId);
   }
  
  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) { 
    // explicitly pass boatId to the parameter recordId
    publish(this.messageContext,BOATMC,{recordId:boatId});
  }
  
  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from draftValues to the 
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
    // notify loading
    const updatedFields = event.detail.draftValues;
    updatedFields.map(row => {
      var index = row.id.substring(4);
      row.id = this.boats[index].Id;
    })
    // Update the records via Apex
    updateBoatList({data: updatedFields})
    .then((result) => {
        const evt = new ShowToastEvent({
          title: SUCCESS_TITLE,
          message: MESSAGE_SHIP_IT,
          variant: SUCCESS_VARIANT
      });
      this.dispatchEvent(evt);
    })
    .catch(error => {
      const evt = new ShowToastEvent({
        title: ERROR_TITLE,
        message: error.message,
        variant: ERROR_VARIANT
    });
    this.dispatchEvent(evt);
    })
    .finally(() => {
      this.draftValues = [];
      this.refresh();
    });
  }
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) { 
    if(isLoading){
      this.dispatchEvent(new CustomEvent('loading'));
    }
    else{
      this.dispatchEvent(new CustomEvent('doneloading'));
    }
  }
}
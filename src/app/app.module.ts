import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { DoctorAvailabilityComponent } from './components/appointments/doctor-availability/doctor-availability.component';
import { PatientRegistrationComponent } from './components/appointments/patient-registration/patient-registration.component';

@NgModule({
  declarations: [
    AppComponent,
    DoctorAvailabilityComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    PatientRegistrationComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
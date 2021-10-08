// Name:	Jozsef Morrissey
// Date:	September 9, 2013
// Prog:    PROG05
// Desc:    This program receives four inputs principle, rate, duration, 
//          interest, and down payment compounding interval. It returns interest
//          final value, interest savings based on down payment and theoretical
//          savings based on larger down payment.

#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#define e 2.71828183

double downPayment(char x);
double savemorecalc(double d, double adj);
double savings(double down);
double savingsAdj(double down, double adj);
double continuously(double down);
double contSaving(double down, double i);

double principle, rate, duration, final; 
int m=0;

char invalid[] = {"Invalid input\n"};


int main(void)
{  double payment=0;
   char interval;
   int term;
   
   do
   {  printf("%23s ENTER ALL NEGATIVE VALUES TO END\n\n", " ");
      printf("Enter the principle amount: ");
      scanf("%lf", &principle);
    
      printf("Enter interest rate: ");
      scanf("%lf", &rate);
   
      printf("How often is the interest compounded yearly monthly weekly dail");
      printf("y or continuous\n(Y/M/W/D/C):");
      getchar();           // The first getchar removes the newline character 
      interval=getchar();  //created by the previous scanf.

      printf("Enter the number of months the loan is for: ");
      scanf("%lf", &duration);  //Duration is declared as a float to accommodate 
                                //partial year loans.
   
      if(principle>0 && rate>0 && rate<100 && duration>0)
      {  duration/=12;
   
         if(rate>1)     //This allows the user to input interest percentages in 
            rate*=.01;  //decimal or whole number form.
   
         if(interval=='C' || interval=='c')
           final=continuously(0);
         else if(interval=='D' || interval=='d')
            m=365;
         else if(interval=='W' || interval=='w')
            m=55;
         else if(interval=='M' || interval=='m')
            m=12;
         else if(interval=='Y' || interval=='y')
            m=1;
         else
         {  printf("%s\n", invalid);
            term=0;   //Ends if the user inputs an invalid interval.
         }   
         if(term!=0)
         {  if(interval!='C' && interval!='c')
               final=principle*(pow(1+(rate/m), (m*duration)));
            
               
            payment=final/(duration*12);
   
            printf("Your loan totals out to be %.2f\nprinciple ", final);
            printf("%.2f\nInterest %.2f", principle, final-principle);
            printf("\nMonthly payment %.2f\n", payment);
            downPayment(interval);
      }  }
      else if(principle>0 || rate>0 || duration>0)
      printf("%s\n", invalid);
   }   
   while (principle>0 || rate>0 || duration>0);  //Performs loop as long as one
                                                 //value is positive.
   system("PAUSE");

    return 0;
}   // end main    


double downPayment(char x)                //down payment computes savings if a
{ double down, savemore, i, saving, adj;  //down payment of 5% 15% or 20% was
  char downYN;                            //applied to the loan.
 
  printf("\nAre you curently contributing a down payment?(Y/N) ");
  getchar();
  downYN=getchar();
  
  if(downYN=='N' || 'n'==downYN || downYN=='Y' || 'y'==downYN)
  {
     if (downYN=='Y' || 'y'==downYN)
     {  printf("How much is your down payment value: ");
        scanf("%lf", &down);
     }
     else if(downYN=='N' || 'n'==downYN)
        down=0;
  
     if(down<0)                 //Checks for negative down payment values.
        printf("%s", invalid);
     
        else if(down/(down+principle)<.05)    //Desides the starting value for 
           adj=.05;                           //adjusted values of the for loop.
      
           else if(down/(down+principle)<.15)
              adj=.15;
        
              else if(down/(down+principle)<.25)
                 adj=.25;
   
      if(x=='c'|| x=='C') //Computes values for continuously compounding 
      {  saving=continuously(down)-final;                      //interest.
         printf("\nYou are already saving; %.2f\n\n", saving); 
              
         for(i=adj; i<=.25; i+=.1)
         {  saving=continuously(down)-contSaving(down, i);
            savemore=savemorecalc(down, i);
            printf("If you saved %.0f%%: %.2f\nYou would s", i*100, savemore); 
            printf("ave %.2f in interest\n\n", saving);
         }
         printf("\n\n");
      }  
  
      else  //Computes values for all other types of compounding interest.        
      {  saving=continuously(down)-final;
         printf("\nYou are already saving; %.2f\n\n", saving);
                
         for(i=adj; i<=.25; i+=.1)
         {  saving=savings(down)-savingsAdj(down, i);
            savemore=savemorecalc(down, i);
            printf("If you saved %.0f%%: %.2f\nYou would s", i*100, savemore); 
            printf("ave %.2f in interest\n\n", saving);
         }
         system("PAUSE");
         printf("\n\n");
   }  }   
   else if(downYN!='N' || 'n'!=downYN || downYN!='Y' || 'y'!=downYN)
      printf("%s\n", invalid);
  return 0;
}

double savemorecalc(double d, double adj)
{  return (principle+d)*(adj);
}
double savings(double down)
{  return (principle+down)*(pow(1+(rate/m), (m*duration)));
} 
double savingsAdj(double down, double adj)
{  return ((principle+down)*(1-adj))*(pow(1+(rate/m), (m*duration)));
}
double continuously(double down)
{  return (principle+down)*pow(e,(rate*duration));
}
double contSaving(double down, double adj)
{  return (principle+down)*(1-adj)*pow(e,(rate*duration));
}



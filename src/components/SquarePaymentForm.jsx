import React from 'react';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';

const SQUARE_APP_ID = import.meta.env.VITE_SQUARE_APP_ID;
const SQUARE_LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID;

const SquarePaymentForm = ({ amount, onTokenGenerated, onError }) => {
  return (
    <div className="square-payment-container w-full mx-auto p-4 border border-gray-200 rounded-xl bg-white shadow-sm mb-4">
      {(!SQUARE_APP_ID || !SQUARE_LOCATION_ID) ? (
        <div className="text-red-500 text-sm">
          Square App ID or Location ID is missing from environment variables.
        </div>
      ) : (
        <PaymentForm
          applicationId={SQUARE_APP_ID}
          locationId={SQUARE_LOCATION_ID}
          cardTokenizeResponseReceived={async (token, verifiedBuyer) => {
            if (token.errors) {
              console.error("Square tokenization errors", token.errors);
              onError?.(token.errors[0].message || "Payment details are invalid");
              return;
            }
            onTokenGenerated?.(token.token);
          }}
          createPaymentRequest={() => ({
            countryCode: 'US',
            currencyCode: 'USD',
            total: {
              amount: (amount || 0).toString(),
              label: 'Total',
            },
          })}
        >
          <CreditCard
            buttonProps={{
              css: {
                backgroundColor: '#2563eb',
                fontSize: '16px',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#1d4ed8',
                },
              },
            }}
          />
        </PaymentForm>
      )}
    </div>
  );
};

export default SquarePaymentForm;

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle } from 'lucide-react';

// Define checkout steps
type CheckoutStep = 'shipping' | 'payment' | 'confirmation';

// Props for the checkout form
interface CheckoutFormProps {
  checkoutStep: CheckoutStep;
  setCheckoutStep: (step: CheckoutStep) => void;
}

// Shipping form schema
const shippingFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  address1: z.string().min(1, { message: 'Address is required' }),
  address2: z.string().optional(),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  postalCode: z.string().min(5, { message: 'Postal code is required' }),
  country: z.string().min(1, { message: 'Country is required' }),
  saveAddress: z.boolean().default(false),
});

// Payment form schema
const paymentFormSchema = z.object({
  cardName: z.string().min(1, { message: 'Name on card is required' }),
  cardNumber: z.string().min(16, { message: 'Card number is required' }).max(16),
  cardExpiry: z.string().min(5, { message: 'Expiry date is required' }).max(5),
  cardCvc: z.string().min(3, { message: 'CVC is required' }).max(4),
  billingAddressSameAsShipping: z.boolean().default(true),
  // Include billing address fields, but they're optional if same as shipping
  billingAddress1: z.string().optional(),
  billingAddress2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  savePaymentMethod: z.boolean().default(false),
});

// Type for the combined form values
type ShippingFormValues = z.infer<typeof shippingFormSchema>;
type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function CheckoutForm({ checkoutStep, setCheckoutStep }: CheckoutFormProps) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [shippingData, setShippingData] = useState<ShippingFormValues | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Shipping form
  const shippingForm = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      saveAddress: false,
    },
  });
  
  // Payment form
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardName: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
      billingAddressSameAsShipping: true,
      billingAddress1: '',
      billingAddress2: '',
      billingCity: '',
      billingState: '',
      billingPostalCode: '',
      billingCountry: 'US',
      savePaymentMethod: false,
    },
  });
  
  // Handle shipping form submission
  const onShippingSubmit = (data: ShippingFormValues) => {
    setShippingData(data);
    setCheckoutStep('payment');
  };
  
  // Handle payment form submission
  const onPaymentSubmit = async (data: PaymentFormValues) => {
    setIsSubmitting(true);
    setPaymentData(data);
    
    try {
      // In a real application, you would process the payment here
      // For now, we'll just simulate a payment process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Move to confirmation step
      setCheckoutStep('confirmation');
    } catch (error) {
      console.error('Payment processing error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle order completion
  const handleCompleteOrder = async () => {
    try {
      setIsSubmitting(true);
      
      // In a real application, you would submit the order to your backend
      // For now, we'll just simulate an order submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear the cart
      await clearCart();
      
      // Redirect to order confirmation page
      router.push('/checkout/confirmation');
    } catch (error) {
      console.error('Error completing order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Tabs value={checkoutStep} className="w-full">
      {/* Checkout steps navigation */}
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger
          value="shipping"
          disabled={checkoutStep !== 'shipping' && !shippingData}
          onClick={() => setCheckoutStep('shipping')}
        >
          Shipping
        </TabsTrigger>
        <TabsTrigger
          value="payment"
          disabled={checkoutStep === 'shipping' || (!paymentData && checkoutStep === 'confirmation')}
          onClick={() => shippingData && setCheckoutStep('payment')}
        >
          Payment
        </TabsTrigger>
        <TabsTrigger
          value="confirmation"
          disabled={checkoutStep !== 'confirmation'}
        >
          Confirmation
        </TabsTrigger>
      </TabsList>
      
      {/* Shipping step */}
      <TabsContent value="shipping" className="space-y-4 mt-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          <Form {...shippingForm}>
            <form onSubmit={shippingForm.handleSubmit(onShippingSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={shippingForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shippingForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shippingForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shippingForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(123) 456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator className="my-4" />
              
              <FormField
                control={shippingForm.control}
                name="address1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={shippingForm.control}
                name="address2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Apt 4B" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={shippingForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shippingForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shippingForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shippingForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={shippingForm.control}
                name="saveAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Save this address for future orders</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="pt-4 text-right">
                <Button type="submit" size="lg">Continue to Payment</Button>
              </div>
            </form>
          </Form>
        </div>
      </TabsContent>
      
      {/* Payment step */}
      <TabsContent value="payment" className="space-y-4 mt-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="cardName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name on Card</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={paymentForm.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <Input placeholder="4111 1111 1111 1111" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={paymentForm.control}
                    name="cardExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input placeholder="MM/YY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="cardCvc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVC</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <FormField
                control={paymentForm.control}
                name="billingAddressSameAsShipping"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Billing address is the same as shipping address</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {!paymentForm.watch('billingAddressSameAsShipping') && (
                <div className="space-y-4 mt-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Billing Address</h3>
                  {/* Billing address form fields would go here */}
                  <FormField
                    control={paymentForm.control}
                    name="billingAddress1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={paymentForm.control}
                      name="billingCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="billingState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Province</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
              
              <FormField
                control={paymentForm.control}
                name="savePaymentMethod"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Save this payment method for future purchases</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCheckoutStep('shipping')}>
                  Back to Shipping
                </Button>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </TabsContent>
      
      {/* Confirmation step */}
      <TabsContent value="confirmation" className="space-y-4 mt-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Order Review</h2>
            <p className="text-muted-foreground mb-8">
              Please review your order details before finalizing.
            </p>
            
            {shippingData && (
              <div className="text-left mb-6">
                <h3 className="font-semibold mb-2">Shipping Information</h3>
                <p>{shippingData.firstName} {shippingData.lastName}</p>
                <p>{shippingData.address1}</p>
                {shippingData.address2 && <p>{shippingData.address2}</p>}
                <p>{shippingData.city}, {shippingData.state} {shippingData.postalCode}</p>
                <p>{shippingData.country}</p>
                <p>{shippingData.email}</p>
                <p>{shippingData.phone}</p>
              </div>
            )}
            
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setCheckoutStep('payment')}>
                Back to Payment
              </Button>
              <Button 
                size="lg" 
                onClick={handleCompleteOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing Order...' : 'Complete Order'}
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
} 
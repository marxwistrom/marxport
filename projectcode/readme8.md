# Payment Processing Service

Secure microservice for payment processing with multiple gateway integration, transaction logging, fraud detection, and PCI compliance.

## 🎯 Project Overview

This project demonstrates a comprehensive payment processing microservice built with .NET Core, featuring secure payment gateway integrations, advanced fraud detection, transaction management, and PCI DSS compliance. Designed for enterprise-level e-commerce and financial applications.

## 🛠 Technologies Used

- **Framework**: C# .NET Core
- **Database**: SQL Server
- **Payment Gateways**: Stripe, PayPal, Square
- **Cloud Platform**: Microsoft Azure
- **Message Queue**: Azure Service Bus
- **Caching**: Redis
- **Security**: Azure Key Vault, SSL/TLS

## ✨ Key Features

### Payment Processing
- **Multiple Gateways**: Stripe, PayPal, Square integration
- **Payment Methods**: Credit cards, digital wallets, bank transfers
- **Currency Support**: Multi-currency processing
- **Recurring Payments**: Subscription and installment handling

### Security & Compliance
- **PCI DSS Compliance**: Level 1 merchant compliance
- **Data Encryption**: End-to-end encryption
- **Tokenization**: Secure payment token management
- **Fraud Detection**: ML-based fraud prevention

### Transaction Management
- **Transaction Logging**: Comprehensive audit trails
- **Refund Processing**: Automated and manual refunds
- **Settlement Tracking**: Payment settlement monitoring
- **Reconciliation**: Automated financial reconciliation

### Monitoring & Analytics
- **Real-time Monitoring**: Transaction status tracking
- **Performance Metrics**: Payment success rates and latency
- **Financial Reporting**: Revenue and transaction analytics
- **Alert System**: Automated fraud and failure notifications

## 🏗 Architecture

### Microservice Design
```
Client → API Gateway → Payment Service → Payment Gateways
                    ↓
              Transaction Database
                    ↓
              Audit & Logging Service
```

### Core Components
- **Payment Controller**: API endpoints for payment operations
- **Gateway Manager**: Payment gateway abstraction layer
- **Transaction Service**: Transaction lifecycle management
- **Fraud Detection Engine**: Risk assessment and prevention
- **Notification Service**: Real-time payment notifications

## 🚀 Implementation Highlights

### Payment Gateway Abstraction
```csharp
public interface IPaymentGateway
{
    Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request);
    Task<RefundResult> ProcessRefundAsync(RefundRequest request);
    Task<PaymentStatus> GetPaymentStatusAsync(string transactionId);
    Task<bool> ValidateWebhookAsync(string payload, string signature);
}

public class StripePaymentGateway : IPaymentGateway
{
    private readonly StripeClient _stripeClient;
    private readonly ILogger<StripePaymentGateway> _logger;
    
    public StripePaymentGateway(StripeClient stripeClient, ILogger<StripePaymentGateway> logger)
    {
        _stripeClient = stripeClient;
        _logger = logger;
    }
    
    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        try
        {
            var paymentIntentOptions = new PaymentIntentCreateOptions
            {
                Amount = (long)(request.Amount * 100), // Convert to cents
                Currency = request.Currency.ToLower(),
                PaymentMethod = request.PaymentMethodId,
                ConfirmationMethod = "manual",
                Confirm = true,
                Metadata = new Dictionary<string, string>
                {
                    {"order_id", request.OrderId},
                    {"customer_id", request.CustomerId}
                }
            };
            
            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(paymentIntentOptions);
            
            return new PaymentResult
            {
                Success = paymentIntent.Status == "succeeded",
                TransactionId = paymentIntent.Id,
                Status = MapStripeStatus(paymentIntent.Status),
                Amount = request.Amount,
                Currency = request.Currency,
                ProcessedAt = DateTime.UtcNow
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe payment processing failed for order {OrderId}", request.OrderId);
            
            return new PaymentResult
            {
                Success = false,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
    }
}
```

### Transaction Management Service
```csharp
[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IFraudDetectionService _fraudDetection;
    private readonly ILogger<PaymentController> _logger;
    
    public PaymentController(
        IPaymentService paymentService,
        IFraudDetectionService fraudDetection,
        ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _fraudDetection = fraudDetection;
        _logger = logger;
    }
    
    [HttpPost("process")]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentRequest request)
    {
        try
        {
            // Validate request
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            // Fraud detection
            var riskAssessment = await _fraudDetection.AssessRiskAsync(request);
            if (riskAssessment.RiskLevel == RiskLevel.High)
            {
                _logger.LogWarning("High-risk payment blocked for order {OrderId}", request.OrderId);
                return BadRequest(new { error = "Payment blocked due to security concerns" });
            }
            
            // Process payment
            var result = await _paymentService.ProcessPaymentAsync(request);
            
            if (result.Success)
            {
                // Send confirmation
                await _paymentService.SendPaymentConfirmationAsync(result);
                
                return Ok(new
                {
                    success = true,
                    transactionId = result.TransactionId,
                    status = result.Status,
                    amount = result.Amount,
                    currency = result.Currency
                });
            }
            else
            {
                return BadRequest(new
                {
                    success = false,
                    error = result.ErrorMessage,
                    errorCode = result.ErrorCode
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Payment processing failed for order {OrderId}", request.OrderId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
    
    [HttpPost("refund")]
    [Authorize(Roles = "Admin,Merchant")]
    public async Task<IActionResult> ProcessRefund([FromBody] ProcessRefundRequest request)
    {
        try
        {
            var result = await _paymentService.ProcessRefundAsync(request);
            
            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    refundId = result.RefundId,
                    amount = result.Amount,
                    status = result.Status
                });
            }
            else
            {
                return BadRequest(new { error = result.ErrorMessage });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Refund processing failed for transaction {TransactionId}", request.TransactionId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
```

### Fraud Detection Engine
```csharp
public class FraudDetectionService : IFraudDetectionService
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IMLModelService _mlModelService;
    private readonly ILogger<FraudDetectionService> _logger;
    
    public async Task<RiskAssessment> AssessRiskAsync(ProcessPaymentRequest request)
    {
        var riskFactors = new List<RiskFactor>();
        
        // Check transaction velocity
        var recentTransactions = await _transactionRepository
            .GetRecentTransactionsByCustomerAsync(request.CustomerId, TimeSpan.FromHours(1));
        
        if (recentTransactions.Count > 5)
        {
            riskFactors.Add(new RiskFactor
            {
                Type = "velocity",
                Score = 0.7,
                Description = "High transaction velocity detected"
            });
        }
        
        // Check amount anomaly
        var customerAverage = await _transactionRepository
            .GetAverageTransactionAmountAsync(request.CustomerId);
        
        if (request.Amount > customerAverage * 5)
        {
            riskFactors.Add(new RiskFactor
            {
                Type = "amount_anomaly",
                Score = 0.6,
                Description = "Transaction amount significantly higher than average"
            });
        }
        
        // Check geolocation
        if (!string.IsNullOrEmpty(request.IpAddress))
        {
            var geoRisk = await CheckGeolocationRiskAsync(request.IpAddress, request.CustomerId);
            if (geoRisk.Score > 0.5)
            {
                riskFactors.Add(geoRisk);
            }
        }
        
        // ML-based risk scoring
        var mlScore = await _mlModelService.PredictFraudRiskAsync(request);
        
        var totalRiskScore = CalculateOverallRisk(riskFactors, mlScore);
        
        return new RiskAssessment
        {
            RiskLevel = DetermineRiskLevel(totalRiskScore),
            RiskScore = totalRiskScore,
            RiskFactors = riskFactors,
            Recommendation = GetRecommendation(totalRiskScore)
        };
    }
    
    private RiskLevel DetermineRiskLevel(double riskScore)
    {
        return riskScore switch
        {
            >= 0.8 => RiskLevel.High,
            >= 0.5 => RiskLevel.Medium,
            _ => RiskLevel.Low
        };
    }
}
```

## 📊 Database Models

### Transaction Entity
```csharp
public class Transaction
{
    public Guid Id { get; set; }
    public string OrderId { get; set; }
    public string CustomerId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string PaymentGateway { get; set; }
    public string GatewayTransactionId { get; set; }
    public TransactionStatus Status { get; set; }
    public string StatusReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? SettledAt { get; set; }
    
    // Audit fields
    public string IpAddress { get; set; }
    public string UserAgent { get; set; }
    public string RiskScore { get; set; }
    
    // Navigation properties
    public List<TransactionEvent> Events { get; set; }
    public List<Refund> Refunds { get; set; }
}

public class TransactionEvent
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public string EventType { get; set; }
    public string EventData { get; set; }
    public DateTime Timestamp { get; set; }
    
    public Transaction Transaction { get; set; }
}
```

## 📈 Advanced Features

### Webhook Handling
```csharp
[HttpPost("webhook/stripe")]
public async Task<IActionResult> StripeWebhook()
{
    var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
    var signature = Request.Headers["Stripe-Signature"];
    
    try
    {
        var stripeEvent = EventUtility.ConstructEvent(
            json, 
            signature, 
            _configuration["Stripe:WebhookSecret"]
        );
        
        switch (stripeEvent.Type)
        {
            case Events.PaymentIntentSucceeded:
                var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
                await _paymentService.HandlePaymentSucceededAsync(paymentIntent);
                break;
                
            case Events.PaymentIntentPaymentFailed:
                var failedPayment = stripeEvent.Data.Object as PaymentIntent;
                await _paymentService.HandlePaymentFailedAsync(failedPayment);
                break;
                
            case Events.ChargeDispute:
                var dispute = stripeEvent.Data.Object as Dispute;
                await _paymentService.HandleChargeDisputeAsync(dispute);
                break;
        }
        
        return Ok();
    }
    catch (StripeException ex)
    {
        _logger.LogError(ex, "Stripe webhook processing failed");
        return BadRequest();
    }
}
```

### Payment Analytics Service
```csharp
public class PaymentAnalyticsService : IPaymentAnalyticsService
{
    public async Task<PaymentMetrics> GetPaymentMetricsAsync(DateTime startDate, DateTime endDate)
    {
        var transactions = await _transactionRepository
            .GetTransactionsByDateRangeAsync(startDate, endDate);
        
        return new PaymentMetrics
        {
            TotalTransactions = transactions.Count,
            TotalAmount = transactions.Sum(t => t.Amount),
            SuccessRate = CalculateSuccessRate(transactions),
            AverageTransactionAmount = transactions.Average(t => t.Amount),
            TopPaymentMethods = GetTopPaymentMethods(transactions),
            FraudRate = CalculateFraudRate(transactions),
            ChargebackRate = await CalculateChargebackRateAsync(transactions)
        };
    }
    
    private double CalculateSuccessRate(List<Transaction> transactions)
    {
        var successfulTransactions = transactions
            .Count(t => t.Status == TransactionStatus.Completed);
        
        return transactions.Count > 0 
            ? (double)successfulTransactions / transactions.Count * 100 
            : 0;
    }
}
```

## 🔒 Security Features

### PCI DSS Compliance
```csharp
public class PCIComplianceService
{
    public async Task<bool> ValidateCardDataAsync(string cardNumber)
    {
        // Never store actual card numbers - use tokenization
        var token = await _tokenizationService.TokenizeAsync(cardNumber);
        
        // Log access for audit
        await _auditService.LogCardDataAccessAsync(
            userId: GetCurrentUserId(),
            action: "card_validation",
            timestamp: DateTime.UtcNow
        );
        
        return IsValidCardNumber(cardNumber);
    }
    
    private bool IsValidCardNumber(string cardNumber)
    {
        // Luhn algorithm implementation
        var digits = cardNumber.Where(char.IsDigit).Select(c => c - '0').ToArray();
        
        for (int i = digits.Length - 2; i >= 0; i -= 2)
        {
            digits[i] *= 2;
            if (digits[i] > 9)
                digits[i] -= 9;
        }
        
        return digits.Sum() % 10 == 0;
    }
}
```

### Data Encryption
```csharp
public class EncryptionService : IEncryptionService
{
    private readonly IKeyVaultService _keyVault;
    
    public async Task<string> EncryptSensitiveDataAsync(string data)
    {
        var encryptionKey = await _keyVault.GetKeyAsync("payment-encryption-key");
        
        using var aes = Aes.Create();
        aes.Key = Convert.FromBase64String(encryptionKey);
        aes.GenerateIV();
        
        using var encryptor = aes.CreateEncryptor();
        using var msEncrypt = new MemoryStream();
        using var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write);
        using var swEncrypt = new StreamWriter(csEncrypt);
        
        swEncrypt.Write(data);
        
        var iv = aes.IV;
        var encrypted = msEncrypt.ToArray();
        
        var result = new byte[iv.Length + encrypted.Length];
        Buffer.BlockCopy(iv, 0, result, 0, iv.Length);
        Buffer.BlockCopy(encrypted, 0, result, iv.Length, encrypted.Length);
        
        return Convert.ToBase64String(result);
    }
}
```

## 📚 Learning Outcomes

This project demonstrates:
- **Microservice Architecture**: Scalable payment service design
- **Payment Gateway Integration**: Multi-provider payment processing
- **Security Best Practices**: PCI DSS compliance and data protection
- **Fraud Detection**: ML-based risk assessment
- **Transaction Management**: Complete payment lifecycle handling
- **Cloud Integration**: Azure services and deployment
- **API Design**: RESTful payment APIs
- **Monitoring & Analytics**: Payment performance tracking

## 🔗 Repository

**GitHub**: [Payment Processing Service](https://github.com/marxwistrom/payment-service)

---

*Part of Marx Wiström's Backend Development Portfolio*

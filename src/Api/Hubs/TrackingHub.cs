using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace DNIContractApi.Hubs
{
    public class TrackingHub : Hub
    {
        public override Task OnConnectedAsync()
        {
            Console.WriteLine($"[SignalR] Client Connected: {Context.ConnectionId}");
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(System.Exception? exception)
        {
            Console.WriteLine($"[SignalR] Client Disconnected: {Context.ConnectionId} - {exception?.Message}");
            return base.OnDisconnectedAsync(exception);
        }

        // El Dashboard Web y la App Móvil se conectarán aquí
        public async Task JoinFleetGroup(string role)
        {
            Console.WriteLine($"[SignalR] Client {Context.ConnectionId} joining group with role: {role}");
            if (role == "Gerente")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "Gerentes");
                Console.WriteLine($"[SignalR] Client {Context.ConnectionId} joined Gerentes");
            }
        }
    }
}
